<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Certificate;
use Illuminate\Support\Facades\Storage;
use setasign\Fpdi\Fpdi;

class CertificateService
{
    /**
     * Generate certificate PDF for a participant
     */
    public function generate(Category $category, array $participant): ?string
    {
        $certificate = $category->certificate;
        
        if (!$certificate || !$certificate->enabled || !$certificate->template_path) {
            return null;
        }

        $templatePath = Storage::disk('public')->path($certificate->template_path);
        
        if (!file_exists($templatePath)) {
            return null;
        }

        // Get field configuration or use default
        $fieldsConfig = $certificate->fields_config ?? $this->getDefaultConfig();

        // Create PDF with FPDI
        $pdf = new Fpdi();
        $pdf->AddPage();
        
        // Import template
        $pdf->setSourceFile($templatePath);
        $templateId = $pdf->importPage(1);
        $pdf->useTemplate($templateId);

        // Render each field
        foreach ($fieldsConfig['fields'] ?? [] as $field) {
            $this->renderField($pdf, $field, $participant, $category);
        }

        // Return PDF content
        return $pdf->Output('S');
    }

    /**
     * Render a single field on the PDF
     */
    private function renderField(Fpdi $pdf, array $field, array $participant, Category $category): void
    {
        $value = $this->getFieldValue($field, $participant, $category);
        
        if (empty($value)) {
            return;
        }

        // Apply prefix/suffix
        $prefix = $field['prefix'] ?? '';
        $suffix = $field['suffix'] ?? '';
        $text = $prefix . $value . $suffix;

        // Set font
        $fontFamily = $this->mapFontFamily($field['fontFamily'] ?? 'helvetica');
        $fontStyle = $this->mapFontStyle($field['fontWeight'] ?? 'normal');
        $fontSize = $field['fontSize'] ?? 12;
        
        $pdf->SetFont($fontFamily, $fontStyle, $fontSize);

        // Set color
        $color = $this->hexToRgb($field['color'] ?? '#000000');
        $pdf->SetTextColor($color['r'], $color['g'], $color['b']);

        // Calculate position
        $x = $field['x'] ?? 0;
        $y = $field['y'] ?? 0;
        
        // Handle alignment
        $align = $field['align'] ?? 'left';
        $textWidth = $pdf->GetStringWidth($text);
        
        if ($align === 'center') {
            $x = $x - ($textWidth / 2);
        } elseif ($align === 'right') {
            $x = $x - $textWidth;
        }

        $pdf->SetXY($x, $y);
        $pdf->Cell($textWidth, $fontSize / 2.8, $text, 0, 0, 'L');
    }

    /**
     * Get value for a field based on its type
     */
    private function getFieldValue(array $field, array $participant, Category $category): ?string
    {
        $type = $field['type'] ?? 'custom';

        return match ($type) {
            'participant_name' => $participant['name'] ?? null,
            'overall_rank' => isset($participant['rank']) ? (string) $participant['rank'] : null,
            'gender_rank' => isset($participant['genderRank']) ? (string) $participant['genderRank'] : null,
            'category_name' => $category->name,
            'finish_time' => $participant['finishTime'] ?? null,
            'net_time' => $participant['netTime'] ?? null,
            'bib' => $participant['bib'] ?? null,
            'gender' => $participant['gender'] ?? null,
            'event_name' => $category->event?->title,
            'event_date' => $category->event?->start_date?->format('d M Y'),
            'custom' => $participant[$field['field'] ?? ''] ?? null,
            default => null,
        };
    }

    /**
     * Map font family name to FPDF compatible
     */
    private function mapFontFamily(string $fontFamily): string
    {
        // FPDF built-in fonts
        $builtIn = ['helvetica', 'arial', 'times', 'courier'];
        
        $normalized = strtolower($fontFamily);
        
        if (in_array($normalized, $builtIn)) {
            return $normalized;
        }

        // Check for custom font
        $fontPath = storage_path("fonts/{$normalized}.php");
        if (file_exists($fontPath)) {
            return $normalized;
        }

        // Default to helvetica
        return 'helvetica';
    }

    /**
     * Map font weight to FPDF style
     */
    private function mapFontStyle(string $fontWeight): string
    {
        return match (strtolower($fontWeight)) {
            'bold' => 'B',
            'italic' => 'I',
            'bolditalic', 'bold-italic' => 'BI',
            default => '',
        };
    }

    /**
     * Convert hex color to RGB
     */
    private function hexToRgb(string $hex): array
    {
        $hex = ltrim($hex, '#');
        
        if (strlen($hex) === 3) {
            $hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
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
                    'x' => 297.5, // A4 landscape center
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

        if (!isset($config['fields']) || !is_array($config['fields'])) {
            $errors[] = 'Fields array is required';
            return $errors;
        }

        foreach ($config['fields'] as $index => $field) {
            if (!isset($field['type'])) {
                $errors[] = "Field {$index}: type is required";
            }
            if (!isset($field['x']) || !is_numeric($field['x'])) {
                $errors[] = "Field {$index}: x position is required";
            }
            if (!isset($field['y']) || !is_numeric($field['y'])) {
                $errors[] = "Field {$index}: y position is required";
            }
        }

        return $errors;
    }
}
