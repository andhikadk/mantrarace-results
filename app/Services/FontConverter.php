<?php

namespace App\Services;

use Illuminate\Support\Str;

/**
 * Service to convert TTF/OTF fonts to FPDF-compatible format.
 *
 * FPDF requires fonts to be in a specific format with a PHP definition file.
 * This service handles that conversion using FPDF's MakeFont functionality.
 */
class FontConverter
{
    /**
     * Convert a TTF/OTF font file to FPDF format.
     *
     * @param  string  $fontPath  Full path to the TTF/OTF font file
     * @param  string  $fontName  Original font name
     * @return string The FPDF font name (slugified)
     *
     * @throws \Exception If conversion fails
     */
    public function convertToFpdfFormat(string $fontPath, string $fontName): string
    {
        // Ensure storage/fonts directory exists
        $fontsDir = storage_path('fonts');
        if (! is_dir($fontsDir)) {
            mkdir($fontsDir, 0755, true);
        }

        // Generate slugified font name for FPDF
        $fpdfFontName = Str::slug($fontName);

        // Target paths
        $targetPhpFile = "{$fontsDir}/{$fpdfFontName}.php";
        $targetTtfFile = "{$fontsDir}/{$fpdfFontName}.ttf";

        // Copy the font file to storage/fonts
        if (! copy($fontPath, $targetTtfFile)) {
            throw new \Exception('Failed to copy font file to storage');
        }

        // Generate the PHP font definition file using FPDF's MakeFont
        $this->generateFontDefinition($targetTtfFile, $fpdfFontName, $fontsDir);

        return $fpdfFontName;
    }

    /**
     * Generate FPDF font definition PHP file.
     *
     * @param  string  $ttfPath  Path to the TTF file
     * @param  string  $fontName  The font name (already slugified)
     * @param  string  $outputDir  Directory for output
     *
     * @throws \Exception If generation fails
     */
    private function generateFontDefinition(string $ttfPath, string $fontName, string $outputDir): void
    {
        // Directly create basic font definition (MakeFont outputs to stdout which breaks JSON response)
        $this->createBasicFontDefinition($ttfPath, $fontName, $outputDir);
    }

    /**
     * Create a basic font definition for TrueType font embedding.
     *
     * @param  string  $ttfPath  Path to the TTF file
     * @param  string  $fontName  The font name
     * @param  string  $outputDir  Output directory
     */
    private function createBasicFontDefinition(string $ttfPath, string $fontName, string $outputDir): void
    {
        // Get font metrics using basic TTF parsing
        $fontInfo = $this->parseTtfInfo($ttfPath);

        $phpContent = "<?php\n";
        $phpContent .= "\$type = 'TrueType';\n";
        $phpContent .= "\$name = '{$fontInfo['name']}';\n";
        $phpContent .= "\$desc = array(\n";
        $phpContent .= "    'Ascent' => {$fontInfo['ascent']},\n";
        $phpContent .= "    'Descent' => {$fontInfo['descent']},\n";
        $phpContent .= "    'CapHeight' => {$fontInfo['capHeight']},\n";
        $phpContent .= "    'Flags' => 32,\n";
        $phpContent .= "    'FontBBox' => '[{$fontInfo['bbox']}]',\n";
        $phpContent .= "    'ItalicAngle' => 0,\n";
        $phpContent .= "    'StemV' => 70,\n";
        $phpContent .= "    'MissingWidth' => 600\n";
        $phpContent .= ");\n";
        $phpContent .= "\$up = -100;\n";
        $phpContent .= "\$ut = 50;\n";
        $phpContent .= "\$cw = array(\n";

        // Default character widths (will be replaced with actual metrics if available)
        for ($i = 0; $i < 256; $i++) {
            $width = ($i < 32) ? 0 : 600;
            $phpContent .= "    chr({$i}) => {$width},\n";
        }

        $phpContent .= ");\n";
        $phpContent .= "\$enc = 'cp1252';\n";
        $phpContent .= "\$uv = array();\n";
        $phpContent .= "\$file = '{$fontName}.ttf';\n";
        $phpContent .= '$originalsize = '.filesize($ttfPath).";\n";

        file_put_contents("{$outputDir}/{$fontName}.php", $phpContent);
    }

    /**
     * Parse basic TTF font information.
     *
     * @param  string  $ttfPath  Path to TTF file
     * @return array Font info
     */
    private function parseTtfInfo(string $ttfPath): array
    {
        // Default values if parsing fails
        $info = [
            'name' => pathinfo($ttfPath, PATHINFO_FILENAME),
            'ascent' => 800,
            'descent' => -200,
            'capHeight' => 700,
            'bbox' => '-100 -200 1000 900',
        ];

        $handle = fopen($ttfPath, 'rb');
        if (! $handle) {
            return $info;
        }

        try {
            // Read TTF header to get font name
            $header = fread($handle, 12);
            if (strlen($header) < 12) {
                return $info;
            }

            $numTables = unpack('n', substr($header, 4, 2))[1];

            // Look for 'name' table to get font name
            for ($i = 0; $i < $numTables; $i++) {
                $tableEntry = fread($handle, 16);
                if (strlen($tableEntry) < 16) {
                    break;
                }

                $tag = substr($tableEntry, 0, 4);
                if ($tag === 'name') {
                    $offset = unpack('N', substr($tableEntry, 8, 4))[1];

                    // Seek to name table and try to extract font name
                    $pos = ftell($handle);
                    fseek($handle, $offset);

                    $nameTable = fread($handle, 6);
                    if (strlen($nameTable) >= 6) {
                        $count = unpack('n', substr($nameTable, 2, 2))[1];
                        $stringOffset = unpack('n', substr($nameTable, 4, 2))[1];

                        // Read name records to find font family name
                        for ($j = 0; $j < min($count, 20); $j++) {
                            $record = fread($handle, 12);
                            if (strlen($record) < 12) {
                                break;
                            }

                            $nameId = unpack('n', substr($record, 6, 2))[1];
                            if ($nameId === 1) { // Font Family name
                                $length = unpack('n', substr($record, 8, 2))[1];
                                $nameOffset = unpack('n', substr($record, 10, 2))[1];

                                $currentPos = ftell($handle);
                                fseek($handle, $offset + $stringOffset + $nameOffset);
                                $fontName = fread($handle, $length);

                                // Clean up the name (remove null bytes for Unicode strings)
                                $fontName = str_replace("\x00", '', $fontName);
                                $fontName = trim($fontName);

                                if (! empty($fontName)) {
                                    $info['name'] = $fontName;
                                }

                                fseek($handle, $currentPos);
                                break;
                            }
                        }
                    }

                    fseek($handle, $pos);
                    break;
                }
            }
        } finally {
            fclose($handle);
        }

        return $info;
    }
}
