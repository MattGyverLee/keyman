/*
 * Keyman is copyright (C) SIL International. MIT License.
 *
 * Project Converter: Converts keyboard projects between KMN and LDML formats
 */

import * as fs from 'fs';
import * as path from 'path';
import { convertKmnToLdml, generateKmn } from '@keymanapp/kmc-kmn-to-ldml';
import { InfrastructureMessages } from '../messages/infrastructureMessages.js';
import { CompilerCallbacks } from '@keymanapp/developer-utils';

/**
 * Options for project conversion
 */
export interface ConvertProjectOptions {
  /** Specific .kmn file to convert (if multiple exist in project) */
  sourceKmn?: string;
  /** New keyboard ID (optional, defaults to source ID) */
  keyboardId?: string;
  /** Copy resource files (fonts, images, docs) - default: true */
  copyResources?: boolean;
  /** Update .kps package file - default: true */
  updatePackage?: boolean;
  /** Verbose output */
  verbose?: boolean;
}

/**
 * Information about a keyboard project
 */
export interface ProjectInfo {
  /** Path to .kpj file (if exists) */
  projectFile?: string;
  /** Project directory */
  projectDir: string;
  /** Keyboard ID */
  keyboardId: string;
  /** Main keyboard source file (.kmn or .xml) */
  sourceFile: string;
  /** Touch layout file (if exists) */
  touchLayoutFile?: string;
  /** Package file (if exists) */
  packageFile?: string;
  /** Resource files (fonts, images, docs, etc.) */
  resourceFiles: string[];
  /** Metadata from project */
  metadata: ProjectMetadata;
}

/**
 * Project metadata
 */
export interface ProjectMetadata {
  name?: string;
  version?: string;
  copyright?: string;
  author?: string;
  languages?: string[];
  description?: string;
}

/**
 * Result of a conversion operation
 */
export interface ConversionResult {
  success: boolean;
  outputDir: string;
  outputProjectFile?: string;
  generatedFiles: string[];
  copiedFiles: string[];
  warnings: string[];
  errors: string[];
}

/**
 * Project converter for KMN ↔ LDML conversion
 */
export class ProjectConverter {
  constructor(
    private callbacks: CompilerCallbacks
  ) {}

  /**
   * Convert a KMN-based project to LDML format
   *
   * @param sourcePath - Path to .kpj file or project directory
   * @param outputDir - Destination directory for converted project
   * @param options - Conversion options
   * @returns Conversion result with details
   */
  async convertKmnToLdml(
    sourcePath: string,
    outputDir: string,
    options: ConvertProjectOptions = {}
  ): Promise<ConversionResult> {
    const result: ConversionResult = {
      success: false,
      outputDir,
      generatedFiles: [],
      copiedFiles: [],
      warnings: [],
      errors: []
    };

    try {
      // Parse source project
      const sourceInfo = await this.parseSourceProject(sourcePath, 'kmn', options);

      if (!sourceInfo.projectFile) {
        result.warnings.push('No .kpj file found. Results may not be as desired. Please verify that only intended files are copied.');
      }

      // Validate source
      if (!fs.existsSync(sourceInfo.sourceFile)) {
        result.errors.push(`Source .kmn file not found: ${sourceInfo.sourceFile}`);
        return result;
      }

      // Create output directory
      if (fs.existsSync(outputDir)) {
        result.errors.push(`Output directory already exists: ${outputDir}`);
        return result;
      }
      fs.mkdirSync(outputDir, { recursive: true });

      // Create source subdirectory
      const outputSourceDir = path.join(outputDir, 'source');
      fs.mkdirSync(outputSourceDir, { recursive: true });

      // Read KMN source
      const kmnSource = fs.readFileSync(sourceInfo.sourceFile, 'utf-8');

      // Read touch layout if exists
      let touchLayout = undefined;
      if (sourceInfo.touchLayoutFile && fs.existsSync(sourceInfo.touchLayoutFile)) {
        const touchLayoutJson = fs.readFileSync(sourceInfo.touchLayoutFile, 'utf-8');
        touchLayout = JSON.parse(touchLayoutJson);
      } else if (sourceInfo.touchLayoutFile) {
        result.warnings.push(`Touch layout file not found: ${sourceInfo.touchLayoutFile}`);
      }

      // Convert KMN to LDML
      const keyboardId = options.keyboardId || sourceInfo.keyboardId;
      const ldmlXml = convertKmnToLdml(kmnSource, {
        locale: sourceInfo.metadata.languages?.[0] || 'en',
        touchLayout,
        useSetMapping: true,
        includeHardware: true,
        includeTouch: true
      });

      // Write LDML file
      const ldmlFile = path.join(outputSourceDir, `${keyboardId}.xml`);
      fs.writeFileSync(ldmlFile, ldmlXml, 'utf-8');
      result.generatedFiles.push(ldmlFile);

      // Copy resource files
      if (options.copyResources !== false) {
        const copied = await this.copyResourceFiles(sourceInfo, outputDir);
        result.copiedFiles.push(...copied);
      }

      // Generate new .kpj file
      const projectFile = await this.generateLdmlProjectFile(
        sourceInfo,
        outputDir,
        keyboardId,
        options
      );
      result.outputProjectFile = projectFile;
      result.generatedFiles.push(projectFile);

      // Update .kps package file
      if (options.updatePackage !== false && sourceInfo.packageFile) {
        const updatedKps = await this.updatePackageFile(
          sourceInfo.packageFile,
          outputDir,
          keyboardId,
          'ldml'
        );
        if (updatedKps) {
          result.generatedFiles.push(updatedKps);
        }
      }

      result.success = true;
      this.callbacks.reportMessage(InfrastructureMessages.Info_ProjectConversionComplete({
        source: sourcePath,
        destination: outputDir
      }));

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error));
    }

    return result;
  }

  /**
   * Convert an LDML-based project to KMN format.
   *
   * This method performs reverse conversion from LDML to KMN format:
   * 1. Parses source LDML project structure
   * 2. Reads LDML XML keyboard file
   * 3. Generates equivalent KMN source code
   * 4. Creates new .kpj project file
   * 5. Copies resource files (if enabled)
   * 6. Updates .kps package file (if enabled)
   *
   * @param sourcePath - Path to source LDML project directory or .kpj file
   * @param outputDir - Output directory for converted KMN project
   * @param options - Conversion options
   * @returns Conversion result with generated/copied files and any warnings/errors
   */
  async convertLdmlToKmn(
    sourcePath: string,
    outputDir: string,
    options: ConvertProjectOptions = {}
  ): Promise<ConversionResult> {
    const result: ConversionResult = {
      success: false,
      outputDir,
      generatedFiles: [],
      copiedFiles: [],
      warnings: [],
      errors: []
    };

    try {
      // Parse source project
      const sourceInfo = await this.parseSourceProject(sourcePath, 'ldml', options);

      if (!sourceInfo.projectFile) {
        result.warnings.push('No .kpj file found. Results may not be as desired. Please verify that only intended files are copied.');
      }

      // Validate source
      if (!fs.existsSync(sourceInfo.sourceFile)) {
        result.errors.push(`Source LDML file not found: ${sourceInfo.sourceFile}`);
        return result;
      }

      // Create output directory
      if (fs.existsSync(outputDir)) {
        result.errors.push(`Output directory already exists: ${outputDir}`);
        return result;
      }
      fs.mkdirSync(outputDir, { recursive: true });

      // Create source subdirectory
      const outputSourceDir = path.join(outputDir, 'source');
      fs.mkdirSync(outputSourceDir, { recursive: true });

      // Read LDML source
      const ldmlXml = fs.readFileSync(sourceInfo.sourceFile, 'utf-8');

      // Convert LDML to KMN
      const keyboardId = options.keyboardId || sourceInfo.keyboardId;
      const kmnSource = generateKmn(ldmlXml);

      // Write KMN file
      const kmnFile = path.join(outputSourceDir, `${keyboardId}.kmn`);
      fs.writeFileSync(kmnFile, kmnSource, 'utf-8');
      result.generatedFiles.push(kmnFile);

      // Add warning about manual review
      result.warnings.push('Generated KMN code should be manually reviewed. Some LDML features may not have direct KMN equivalents.');

      // Copy resource files
      if (options.copyResources !== false) {
        const copied = await this.copyResourceFiles(sourceInfo, outputDir);
        result.copiedFiles.push(...copied);
      }

      // Generate new .kpj file
      const projectFile = await this.generateKmnProjectFile(
        sourceInfo,
        outputDir,
        keyboardId,
        options
      );
      result.outputProjectFile = projectFile;
      result.generatedFiles.push(projectFile);

      // Update .kps package file
      if (options.updatePackage !== false && sourceInfo.packageFile) {
        const updatedKps = await this.updatePackageFile(
          sourceInfo.packageFile,
          outputDir,
          keyboardId,
          'kmn'
        );
        if (updatedKps) {
          result.generatedFiles.push(updatedKps);
        }
      }

      result.success = true;
      this.callbacks.reportMessage(InfrastructureMessages.Info_ProjectConversionComplete({
        source: sourcePath,
        destination: outputDir
      }));

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error));
    }

    return result;
  }

  /**
   * Parse source project to extract information
   */
  private async parseSourceProject(
    sourcePath: string,
    expectedFormat: 'kmn' | 'ldml',
    options: ConvertProjectOptions
  ): Promise<ProjectInfo> {
    let projectFile: string | undefined;
    let projectDir: string;

    // Determine if sourcePath is .kpj or directory
    if (sourcePath.endsWith('.kpj')) {
      projectFile = sourcePath;
      projectDir = path.dirname(sourcePath);
    } else {
      projectDir = sourcePath;
      // Try to find .kpj
      const kpjFiles = fs.readdirSync(projectDir).filter(f => f.endsWith('.kpj'));
      if (kpjFiles.length === 1) {
        projectFile = path.join(projectDir, kpjFiles[0]);
      } else if (kpjFiles.length > 1) {
        this.callbacks.reportMessage(InfrastructureMessages.Warn_MultipleProjectFiles({
          directory: projectDir
        }));
      }
    }

    // Find keyboard source file
    let sourceFile: string;
    let keyboardId: string;

    if (expectedFormat === 'kmn') {
      // Find .kmn file
      if (options.sourceKmn) {
        sourceFile = path.resolve(projectDir, options.sourceKmn);
        keyboardId = path.basename(sourceFile, '.kmn');
      } else {
        const kmnFiles = this.findFilesRecursive(projectDir, '.kmn');
        if (kmnFiles.length === 0) {
          throw new Error('No .kmn files found in project directory');
        } else if (kmnFiles.length > 1) {
          throw new Error(`Multiple .kmn files found. Please specify which one to convert using --source-kmn:\n${kmnFiles.join('\n')}`);
        }
        sourceFile = kmnFiles[0];
        keyboardId = path.basename(sourceFile, '.kmn');
      }
    } else {
      // Find .xml file
      const xmlFiles = this.findFilesRecursive(projectDir, '.xml');
      if (xmlFiles.length === 0) {
        throw new Error('No .xml files found in project directory');
      }
      sourceFile = xmlFiles[0];
      keyboardId = path.basename(sourceFile, '.xml');
    }

    // Find touch layout file
    const touchLayoutFile = this.findFilesRecursive(projectDir, '.keyman-touch-layout')[0];

    // Find package file
    const packageFile = this.findFilesRecursive(projectDir, '.kps')[0];

    // Find resource files
    const resourceFiles = this.findResourceFiles(projectDir, sourceFile);

    // Extract metadata
    const metadata = projectFile ? this.parseProjectFile(projectFile) : {};

    return {
      projectFile,
      projectDir,
      keyboardId,
      sourceFile,
      touchLayoutFile,
      packageFile,
      resourceFiles,
      metadata
    };
  }

  /**
   * Find files recursively with specific extension
   */
  private findFilesRecursive(dir: string, ext: string): string[] {
    const results: string[] = [];

    const search = (currentDir: string) => {
      const files = fs.readdirSync(currentDir);
      for (const file of files) {
        const fullPath = path.join(currentDir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          search(fullPath);
        } else if (stat.isFile() && file.endsWith(ext)) {
          results.push(fullPath);
        }
      }
    };

    search(dir);
    return results;
  }

  /**
   * Find resource files (fonts, images, docs, etc.)
   */
  private findResourceFiles(projectDir: string, excludeSource: string): string[] {
    const resources: string[] = [];
    const resourceExtensions = ['.ttf', '.otf', '.woff', '.woff2', '.png', '.jpg', '.svg', '.gif', '.ico', '.md', '.htm', '.html', '.css', '.js'];

    const search = (currentDir: string) => {
      const files = fs.readdirSync(currentDir);
      for (const file of files) {
        const fullPath = path.join(currentDir, file);

        if (fullPath === excludeSource) continue;

        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules' && file !== 'build') {
          search(fullPath);
        } else if (stat.isFile()) {
          const ext = path.extname(file).toLowerCase();
          if (resourceExtensions.includes(ext)) {
            resources.push(fullPath);
          }
        }
      }
    };

    search(projectDir);
    return resources;
  }

  /**
   * Parse .kpj file to extract metadata
   */
  private parseProjectFile(projectFile: string): ProjectMetadata {
    // Basic XML parsing - in real implementation, use proper XML parser
    const content = fs.readFileSync(projectFile, 'utf-8');

    return {
      name: this.extractXmlValue(content, 'Name'),
      version: this.extractXmlValue(content, 'Version'),
      copyright: this.extractXmlValue(content, 'Copyright'),
      author: this.extractXmlValue(content, 'Author'),
      description: this.extractXmlValue(content, 'Description')
    };
  }

  /**
   * Extract value from XML content (simple regex-based)
   */
  private extractXmlValue(content: string, tagName: string): string | undefined {
    const match = content.match(new RegExp(`<${tagName}>([^<]*)</${tagName}>`));
    return match ? match[1] : undefined;
  }

  /**
   * Copy resource files from source to destination
   */
  private async copyResourceFiles(source: ProjectInfo, destDir: string): Promise<string[]> {
    const copied: string[] = [];

    for (const resourceFile of source.resourceFiles) {
      const relativePath = path.relative(source.projectDir, resourceFile);
      const destFile = path.join(destDir, relativePath);

      // Create destination directory
      const destFileDir = path.dirname(destFile);
      if (!fs.existsSync(destFileDir)) {
        fs.mkdirSync(destFileDir, { recursive: true });
      }

      // Copy file
      fs.copyFileSync(resourceFile, destFile);
      copied.push(destFile);
    }

    return copied;
  }

  /**
   * Generate new .kpj file for LDML project
   */
  private async generateLdmlProjectFile(
    source: ProjectInfo,
    destDir: string,
    keyboardId: string,
    options: ConvertProjectOptions
  ): Promise<string> {
    const projectFile = path.join(destDir, `${keyboardId}.kpj`);

    // Create basic .kpj structure
    const kpj = `<?xml version="1.0" encoding="utf-8"?>
<KeymanDeveloperProject>
  <Options>
    <BuildPath>$PROJECTPATH/build</BuildPath>
    <CompilerWarningsAsErrors>True</CompilerWarningsAsErrors>
    <WarnDeprecatedCode>True</WarnDeprecatedCode>
  </Options>
  <Files>
    <File>
      <ID>id_${keyboardId}</ID>
      <Filename>${keyboardId}.xml</Filename>
      <Filepath>source/${keyboardId}.xml</Filepath>
      <FileVersion></FileVersion>
      <FileType>.xml</FileType>
      <Details>
        <Name>${source.metadata.name || keyboardId}</Name>
        <Copyright>${source.metadata.copyright || 'Copyright © ' + new Date().getFullYear()}</Copyright>
        <Version>${source.metadata.version || '1.0'}</Version>
      </Details>
    </File>
  </Files>
</KeymanDeveloperProject>`;

    fs.writeFileSync(projectFile, kpj, 'utf-8');
    return projectFile;
  }

  /**
   * Generate new .kpj file for KMN project
   */
  private async generateKmnProjectFile(
    source: ProjectInfo,
    destDir: string,
    keyboardId: string,
    options: ConvertProjectOptions
  ): Promise<string> {
    const projectFile = path.join(destDir, `${keyboardId}.kpj`);

    // Create basic .kpj structure for KMN project
    const kpj = `<?xml version="1.0" encoding="utf-8"?>
<KeymanDeveloperProject>
  <Options>
    <BuildPath>$PROJECTPATH/build</BuildPath>
    <CompilerWarningsAsErrors>True</CompilerWarningsAsErrors>
    <WarnDeprecatedCode>True</WarnDeprecatedCode>
  </Options>
  <Files>
    <File>
      <ID>id_${keyboardId}</ID>
      <Filename>${keyboardId}.kmn</Filename>
      <Filepath>source/${keyboardId}.kmn</Filepath>
      <FileVersion></FileVersion>
      <FileType>.kmn</FileType>
      <Details>
        <Name>${source.metadata.name || keyboardId}</Name>
        <Copyright>${source.metadata.copyright || 'Copyright © ' + new Date().getFullYear()}</Copyright>
        <Version>${source.metadata.version || '1.0'}</Version>
      </Details>
    </File>
  </Files>
</KeymanDeveloperProject>`;

    fs.writeFileSync(projectFile, kpj, 'utf-8');
    return projectFile;
  }

  /**
   * Update .kps package file for converted format
   */
  private async updatePackageFile(
    sourceKps: string,
    destDir: string,
    keyboardId: string,
    format: 'ldml' | 'kmn'
  ): Promise<string | null> {
    if (!fs.existsSync(sourceKps)) {
      return null;
    }

    const destKps = path.join(destDir, `${keyboardId}.kps`);
    let content = fs.readFileSync(sourceKps, 'utf-8');

    // Update file references from .kmn to .xml or vice versa
    if (format === 'ldml') {
      content = content.replace(/\.kmn"/g, '.xml"');
      content = content.replace(/\.kmx"/g, '.xml"');
    } else {
      content = content.replace(/\.xml"/g, '.kmn"');
    }

    fs.writeFileSync(destKps, content, 'utf-8');
    return destKps;
  }
}
