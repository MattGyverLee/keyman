/*
 * Keyman is copyright (C) SIL International. MIT License.
 *
 * Convert Project Command
 * Converts keyboard projects between KMN and LDML formats
 */

import { Command } from 'commander';
import { ProjectConverter, ConvertProjectOptions } from '../util/projectConverter.js';
import { InfrastructureMessages } from '../messages/infrastructureMessages.js';
import { NodeCompilerCallbacks } from '../util/NodeCompilerCallbacks.js';

/**
 * Register the convert project command with Commander
 */
export function declareConvertProject(program: Command): void {
  const convertCmd = program
    .command('convert')
    .description('Convert keyboard projects between formats');

  convertCmd
    .command('project <source>')
    .description('Convert a keyboard project between KMN and LDML formats')
    .requiredOption('--format <format>', 'Target format: ldml or kmn')
    .requiredOption('--output <folder>', 'Output folder for converted project')
    .option('--source-kmn <file>', 'Specific .kmn file to convert (if multiple exist)')
    .option('--keyboard-id <id>', 'New keyboard ID (optional, defaults to source ID)')
    .option('--no-copy-resources', 'Skip copying resource files (fonts, images, docs)')
    .option('--no-update-package', 'Skip updating .kps package file')
    .option('--verbose', 'Detailed output during conversion')
    .action(convertProjectAction);
}

/**
 * Action handler for convert project command
 */
async function convertProjectAction(
  source: string,
  options: {
    format: string;
    output: string;
    sourceKmn?: string;
    keyboardId?: string;
    copyResources: boolean;
    updatePackage: boolean;
    verbose: boolean;
  }
): Promise<void> {
  const callbacks = new NodeCompilerCallbacks({
    logLevel: options.verbose ? 'debug' : 'info'
  });

  try {
    // Validate format
    const format = options.format.toLowerCase();
    if (format !== 'ldml' && format !== 'kmn') {
      callbacks.reportMessage(InfrastructureMessages.Error_FileTypeNotRecognized({
        filename: format,
        extensions: 'ldml, kmn'
      }));
      process.exit(1);
    }

    // Report start of conversion
    callbacks.reportMessage(InfrastructureMessages.Info_ConvertingProject({
      source,
      format: format.toUpperCase()
    }));

    // Create converter
    const converter = new ProjectConverter(callbacks);

    // Prepare options
    const convertOptions: ConvertProjectOptions = {
      sourceKmn: options.sourceKmn,
      keyboardId: options.keyboardId,
      copyResources: options.copyResources,
      updatePackage: options.updatePackage,
      verbose: options.verbose
    };

    // Perform conversion
    let result;
    if (format === 'ldml') {
      result = await converter.convertKmnToLdml(source, options.output, convertOptions);
    } else {
      result = await converter.convertLdmlToKmn(source, options.output, convertOptions);
    }

    // Report results
    if (result.success) {
      console.log('\n✓ Conversion successful!\n');
      console.log(`Output directory: ${result.outputDir}`);

      if (result.generatedFiles.length > 0) {
        console.log(`\nGenerated files (${result.generatedFiles.length}):`);
        result.generatedFiles.forEach(f => console.log(`  ${f}`));
      }

      if (result.copiedFiles.length > 0 && options.verbose) {
        console.log(`\nCopied files (${result.copiedFiles.length}):`);
        result.copiedFiles.forEach(f => console.log(`  ${f}`));
      }

      if (result.warnings.length > 0) {
        console.log(`\n⚠ Warnings (${result.warnings.length}):`);
        result.warnings.forEach(w => console.log(`  ${w}`));
        console.log('\nPlease verify that only intended files were copied.');
      }

      process.exit(0);
    } else {
      console.error('\n✗ Conversion failed\n');

      if (result.errors.length > 0) {
        console.error('Errors:');
        result.errors.forEach(e => console.error(`  ${e}`));
      }

      if (result.warnings.length > 0) {
        console.error('\nWarnings:');
        result.warnings.forEach(w => console.error(`  ${w}`));
      }

      process.exit(1);
    }

  } catch (error) {
    callbacks.reportMessage(InfrastructureMessages.Fatal_UnexpectedException({
      e: error
    }));
    process.exit(1);
  }
}
