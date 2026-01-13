<?php

namespace App\Services;

use App\Models\Category;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Mpdf\Mpdf;

class CertificateService
{
    /**
     * Generate certificate PDF for a participant
     */
    public function generate(Category $category, array $participant): ?string
    {
        $certificate = $category->certificate;

        if (! $certificate || ! $certificate->enabled || ! $certificate->template_path) {
            return null;
        }

        return $this->generateWithConfig($category, $participant, $certificate->fields_config ?? $this->getDefaultConfig());
    }

    /**
     * Generate certificate PDF with custom field configuration (for preview)
     */
    public function generateWithConfig(Category $category, array $participant, array $fieldsConfig, bool $isPreview = false): ?string
    {
        $certificate = $category->certificate;

        if (! $certificate || ! $certificate->template_path) {
            return null;
        }

        $templatePath = Storage::disk('public')->path($certificate->template_path);

        if (! file_exists($templatePath)) {
            return null;
        }

        // Get custom fonts from storage
        $fontDir = Storage::disk('public')->path('fonts');
        $customFonts = $this->getCustomFontData($fieldsConfig);

        // Create mPDF instance with custom font support
        $config = [
            'tempDir' => storage_path('app/mpdf'),
            'format' => [842, 595], // A4 landscape in points
            'margin_left' => 0,
            'margin_right' => 0,
            'margin_top' => 0,
            'margin_bottom' => 0,
        ];

        // Add custom font directory if fonts exist
        if (is_dir($fontDir)) {
            $config['fontDir'] = [$fontDir];
            $config['fontdata'] = $customFonts;
        }

        // Ensure temp directory exists
        if (! is_dir($config['tempDir'])) {
            mkdir($config['tempDir'], 0755, true);
        }

        $mpdf = new Mpdf($config);

        // Import PDF template as background
        $mpdf->SetSourceFile($templatePath);
        $templateId = $mpdf->ImportPage(1);
        $size = $mpdf->GetTemplateSize($templateId);

        // Set page size based on template
        $mpdf->AddPageByArray([
            'orientation' => $size['width'] > $size['height'] ? 'L' : 'P',
            'sheet-size' => [$size['width'], $size['height']],
        ]);

        // Use template as background
        $mpdf->UseTemplate($templateId);

        // Render each field
        foreach ($fieldsConfig['fields'] ?? [] as $field) {
            $this->renderField($mpdf, $field, $participant, $category, $size, $isPreview);
        }

        // Return PDF content
        return $mpdf->Output('', 'S');
    }

    /**
     * Get custom font data for mPDF configuration
     */
    private function getCustomFontData(array $fieldsConfig): array
    {
        $fontData = [];
        $fontDir = Storage::disk('public')->path('fonts');

        foreach ($fieldsConfig['fields'] ?? [] as $field) {
            if (($field['fontFamily'] ?? '') === 'custom') {
                $fontName = $field['fpdfFontName'] ?? null;
                if (empty($fontName) && ! empty($field['customFontName'])) {
                    $fontName = Str::slug($field['customFontName']);
                }

                if ($fontName) {
                    // Check if font file exists
                    $ttfFile = "{$fontDir}/{$fontName}.ttf";
                    $otfFile = "{$fontDir}/{$fontName}.otf";

                    if (file_exists($ttfFile)) {
                        $fontData[$fontName] = [
                            'R' => "{$fontName}.ttf",
                        ];
                    } elseif (file_exists($otfFile)) {
                        $fontData[$fontName] = [
                            'R' => "{$fontName}.otf",
                        ];
                    }
                }
            }
        }

        return $fontData;
    }

    /**
     * Render a single field on the PDF
     */
    private function renderField(Mpdf $mpdf, array $field, array $participant, Category $category, array $pageSize, bool $isPreview = false): void
    {
        $value = $this->getFieldValue($field, $participant, $category, $isPreview);

        if (empty($value)) {
            return;
        }

        // Apply prefix/suffix
        $prefix = $field['prefix'] ?? '';
        $suffix = $field['suffix'] ?? '';
        $text = $prefix.$value.$suffix;

        // Apply truncation if maxLength is set
        if (! empty($field['maxLength']) && strlen($text) > $field['maxLength']) {
            $maxLength = (int) $field['maxLength'];
            $words = explode(' ', $text);
            if (count($words) > 1) {
                $abbreviated = $words;
                for ($i = count($words) - 1; $i >= 1; $i--) {
                    $abbreviated[$i] = strtoupper(substr($abbreviated[$i], 0, 1));
                    $currentString = implode(' ', $abbreviated);
                    if (strlen($currentString) <= $maxLength) {
                        $text = $currentString;
                        break;
                    }
                    if ($i === 1) {
                        $text = $currentString;
                    }
                }
            } else {
                $text = substr($text, 0, $maxLength);
            }
        }

        // Apply uppercase
        if (! empty($field['uppercase'])) {
            $text = strtoupper($text);
        }

        // Get font settings
        $fontFamily = $this->getFieldFontFamily($field);
        $fontWeight = $field['fontWeight'] ?? 'normal';
        $fontSize = (float) ($field['fontSize'] ?? 12);
        $color = $field['color'] ?? '#000000';

        // Convert pt to mm for mPDF (1 pt = 0.352778 mm)
        $xMm = (float) ($field['x'] ?? 0) * 0.352778;
        $yMm = (float) ($field['y'] ?? 0) * 0.352778;

        // Parse color
        $rgb = $this->hexToRgb($color);

        // Set font style
        $fontStyle = '';
        if (strtolower($fontWeight) === 'bold') {
            $fontStyle = 'B';
        } elseif (strtolower($fontWeight) === 'italic') {
            $fontStyle = 'I';
        } elseif (in_array(strtolower($fontWeight), ['bolditalic', 'bold-italic'])) {
            $fontStyle = 'BI';
        }

        // Apply font and color
        $mpdf->SetFont($fontFamily, $fontStyle, $fontSize);
        $mpdf->SetTextColor($rgb['r'], $rgb['g'], $rgb['b']);

        // Get text width for alignment
        $textWidth = $mpdf->GetStringWidth($text);

        // Handle alignment - adjust X position
        $align = $field['align'] ?? 'left';
        if ($align === 'center') {
            $xMm = $xMm - ($textWidth / 2);
        } elseif ($align === 'right') {
            $xMm = $xMm - $textWidth;
        }

        // Position and write text
        $mpdf->SetXY($xMm, $yMm);
        $mpdf->Cell($textWidth, 0, $text, 0, 0, 'L');
    }

    /**
     * Get value for a field based on its type
     */
    private function getFieldValue(array $field, array $participant, Category $category, bool $isPreview = false): ?string
    {
        $type = $field['type'] ?? 'custom';

        // In preview mode, use customText if available (for testing/preview purposes)
        if ($isPreview && ! empty($field['customText'])) {
            return $field['customText'];
        }

        return match ($type) {
            'participant_name' => $participant['name'] ?? null,
            'overall_rank' => isset($participant['overallRank']) ? (string) $participant['overallRank'] : (isset($participant['rank']) ? (string) $participant['rank'] : null),
            'gender_rank' => isset($participant['genderRank']) ? (string) $participant['genderRank'] : null,
            'category_name' => $category->name,
            'finish_time' => $participant['finishTime'] ?? null,
            'net_time' => $participant['netTime'] ?? null,
            'bib' => $participant['bib'] ?? null,
            'gender' => $participant['gender'] ?? null,
            'event_name' => $category->event?->title,
            'event_date' => $category->event?->start_date?->format('d M Y'),
            'custom' => $field['customText'] ?? $field['field'] ?? 'Custom Text',
            default => null,
        };
    }

    /**
     * Get font family for a field
     */
    private function getFieldFontFamily(array $field): string
    {
        $fontFamily = $field['fontFamily'] ?? 'helvetica';

        if ($fontFamily === 'custom') {
            $customFontName = $field['fpdfFontName'] ?? null;
            if (empty($customFontName) && ! empty($field['customFontName'])) {
                $customFontName = Str::slug($field['customFontName']);
            }

            if ($customFontName) {
                return $customFontName;
            }
        }

        // Map common font names to mPDF compatible names
        return match (strtolower($fontFamily)) {
            'helvetica', 'arial' => 'dejavusans',
            'times' => 'dejavuserif',
            'courier' => 'dejavusansmono',
            default => 'dejavusans',
        };
    }

    /**
     * Map font weight to CSS value
     */
    private function mapFontWeight(string $fontWeight): string
    {
        return match (strtolower($fontWeight)) {
            'bold' => 'bold',
            'italic' => 'normal',
            default => 'normal',
        };
    }

    /**
     * Convert hex color to RGB
     */
    private function hexToRgb(string $hex): array
    {
        $hex = ltrim($hex, '#');

        if (strlen($hex) === 3) {
            $hex = $hex[0].$hex[0].$hex[1].$hex[1].$hex[2].$hex[2];
        }

        return [
            'r' => hexdec(substr($hex, 0, 2)),
            'g' => hexdec(substr($hex, 2, 2)),
            'b' => hexdec(substr($hex, 4, 2)),
        ];
    }

    /**
     * Get default field configuration
     */
    public function getDefaultConfig(): array
    {
        return [
            'fields' => [
                [
                    'type' => 'participant_name',
                    'x' => 297.5,
                    'y' => 120,
                    'fontSize' => 36,
                    'fontFamily' => 'helvetica',
                    'fontWeight' => 'bold',
                    'color' => '#000000',
                    'align' => 'center',
                ],
            ],
            'pageSize' => [
                'width' => 842,
                'height' => 595,
            ],
        ];
    }

    /**
     * Validate field configuration
     */
    public function validateConfig(array $config): array
    {
        $errors = [];

        if (! isset($config['fields']) || ! is_array($config['fields'])) {
            $errors[] = 'Fields array is required';

            return $errors;
        }

        foreach ($config['fields'] as $index => $field) {
            if (! isset($field['type'])) {
                $errors[] = "Field {$index}: type is required";
            }
            if (! isset($field['x']) || ! is_numeric($field['x'])) {
                $errors[] = "Field {$index}: x position is required";
            }
            if (! isset($field['y']) || ! is_numeric($field['y'])) {
                $errors[] = "Field {$index}: y position is required";
            }
        }

        return $errors;
    }
}
