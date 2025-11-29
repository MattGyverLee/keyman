(*
 * Keyman is copyright (C) SIL Global. MIT License.
 *
 * Parameters dialog for converting keyboard projects between KMN and LDML formats
 *)
unit Keyman.Developer.UI.Project.UfrmConvertProjectParameters;

interface

uses
  System.Classes,
  System.SysUtils,
  System.UITypes,
  Winapi.Messages,
  Winapi.Windows,
  Vcl.Controls,
  Vcl.Dialogs,
  Vcl.Forms,
  Vcl.Graphics,
  Vcl.StdCtrls,

  UfrmTike,
  Browse4Folder;

type
  TConversionFormat = (cfKmnToLdml, cfLdmlToKmn);

  TfrmConvertProjectParameters = class(TTikeForm)
    cmdOK: TButton;
    cmdCancel: TButton;
    dlgBrowseSourceProject: TFileOpenDialog;
    gbSourceProject: TGroupBox;
    lblSourceProject: TLabel;
    editSourceProject: TEdit;
    cmdBrowseSourceProject: TButton;
    gbDestination: TGroupBox;
    lblDestinationFolder: TLabel;
    editDestinationFolder: TEdit;
    cmdBrowseDestination: TButton;
    gbOptions: TGroupBox;
    chkCopyResources: TCheckBox;
    chkUpdatePackage: TCheckBox;
    lblConversionFormat: TLabel;
    lblFormatDescription: TLabel;
    procedure cmdOKClick(Sender: TObject);
    procedure FormCreate(Sender: TObject);
    procedure cmdBrowseSourceProjectClick(Sender: TObject);
    procedure cmdBrowseDestinationClick(Sender: TObject);
    procedure editSourceProjectChange(Sender: TObject);
    procedure editDestinationFolderChange(Sender: TObject);
  private
    dlgBrowse: TBrowse4Folder;
    FConversionFormat: TConversionFormat;
    function GetSourceProject: string;
    function GetDestinationFolder: string;
    function GetCopyResources: Boolean;
    function GetUpdatePackage: Boolean;
    function Validate: Boolean;
    procedure EnableControls;
    procedure SetConversionFormat(const Value: TConversionFormat);
    procedure UpdateFormatDescription;
  protected
    function GetHelpTopic: string; override;
  public
    property ConversionFormat: TConversionFormat read FConversionFormat write SetConversionFormat;
    property SourceProject: string read GetSourceProject;
    property DestinationFolder: string read GetDestinationFolder;
    property CopyResources: Boolean read GetCopyResources;
    property UpdatePackage: Boolean read GetUpdatePackage;
  end;

function ShowConvertProjectParameters(Owner: TComponent; Format: TConversionFormat): Boolean;

implementation

uses
  KeymanDeveloperOptions,
  Keyman.Developer.System.KmcWrapper,
  Keyman.Developer.System.HelpTopics,
  UfrmMain;

{$R *.dfm}

function ShowConvertProjectParameters(Owner: TComponent; Format: TConversionFormat): Boolean;
var
  f: TfrmConvertProjectParameters;
  wrapper: TKmcWrapper;
  formatStr: string;
  outputProjectFile: string;
  projectId: string;
begin
  f := TfrmConvertProjectParameters.Create(Owner);
  try
    f.ConversionFormat := Format;
    Result := f.ShowModal = mrOk;
    if not Result then
      Exit;

    // Determine output format string
    if Format = cfKmnToLdml then
      formatStr := 'ldml'
    else
      formatStr := 'kmn';

    wrapper := TKmcWrapper.Create;
    try
      if wrapper.ConvertProject(
        f.SourceProject,
        f.DestinationFolder,
        formatStr,
        '',  // sourceKmn - not specified
        f.CopyResources,
        f.UpdatePackage
      ) then
      begin
        // Determine the output project file path
        // The destination folder should contain a .kpj file
        projectId := ExtractFileName(ExcludeTrailingPathDelimiter(f.DestinationFolder));
        outputProjectFile := IncludeTrailingPathDelimiter(f.DestinationFolder) +
                            projectId + PathDelim +
                            projectId + '.kpj';

        if FileExists(outputProjectFile) then
          frmKeymanDeveloper.OpenProject(outputProjectFile);
        Result := True;
      end
      else
        Result := False;
    finally
      wrapper.Free;
    end;
  finally
    f.Free;
  end;
end;

{ TfrmConvertProjectParameters }

procedure TfrmConvertProjectParameters.FormCreate(Sender: TObject);
begin
  inherited;
  editDestinationFolder.Text := FKeymanDeveloperOptions.DefaultProjectPath;

  dlgBrowse := TBrowse4Folder.Create(Self);
  dlgBrowse.InitialDir := editDestinationFolder.Text;
  dlgBrowse.Options := [OnlySelectFileSysDir, ShowEditBox, UseNewDialogStyle];
  dlgBrowse.Root := Desktop;
  dlgBrowse.Title := 'Select destination folder';

  // Set default options
  chkCopyResources.Checked := True;
  chkUpdatePackage.Checked := True;

  UpdateFormatDescription;
  EnableControls;
end;

procedure TfrmConvertProjectParameters.cmdBrowseDestinationClick(Sender: TObject);
begin
  dlgBrowse.InitialDir := editDestinationFolder.Text;

  if dlgBrowse.Execute and (dlgBrowse.FileName <> '') then
    editDestinationFolder.Text := ExcludeTrailingPathDelimiter(dlgBrowse.FileName);
end;

procedure TfrmConvertProjectParameters.cmdBrowseSourceProjectClick(Sender: TObject);
begin
  dlgBrowseSourceProject.Title := 'Select source project file';
  dlgBrowseSourceProject.DefaultExtension := 'kpj';
  dlgBrowseSourceProject.FileTypes.Clear;
  dlgBrowseSourceProject.FileTypes.Add.DisplayName := 'Keyman Project Files';
  dlgBrowseSourceProject.FileTypes[0].FileMask := '*.kpj';

  if dlgBrowseSourceProject.Execute then
  begin
    editSourceProject.Text := dlgBrowseSourceProject.FileName;
    EnableControls;
  end;
end;

procedure TfrmConvertProjectParameters.cmdOKClick(Sender: TObject);
begin
  if Validate then
    ModalResult := mrOk;
end;

procedure TfrmConvertProjectParameters.editSourceProjectChange(Sender: TObject);
begin
  EnableControls;
end;

procedure TfrmConvertProjectParameters.editDestinationFolderChange(Sender: TObject);
begin
  EnableControls;
end;

procedure TfrmConvertProjectParameters.EnableControls;
var
  e: Boolean;
begin
  e := (Trim(editSourceProject.Text) <> '') and
    FileExists(Trim(editSourceProject.Text)) and
    (Trim(editDestinationFolder.Text) <> '');

  cmdOK.Enabled := e;
end;

function TfrmConvertProjectParameters.GetSourceProject: string;
begin
  Result := Trim(editSourceProject.Text);
end;

function TfrmConvertProjectParameters.GetDestinationFolder: string;
begin
  Result := Trim(editDestinationFolder.Text);
end;

function TfrmConvertProjectParameters.GetCopyResources: Boolean;
begin
  Result := chkCopyResources.Checked;
end;

function TfrmConvertProjectParameters.GetUpdatePackage: Boolean;
begin
  Result := chkUpdatePackage.Checked;
end;

function TfrmConvertProjectParameters.GetHelpTopic: string;
begin
  Result := SHelpTopic_Context_ConvertProject;
end;

procedure TfrmConvertProjectParameters.SetConversionFormat(const Value: TConversionFormat);
begin
  FConversionFormat := Value;
  UpdateFormatDescription;
end;

procedure TfrmConvertProjectParameters.UpdateFormatDescription;
begin
  if FConversionFormat = cfKmnToLdml then
  begin
    Caption := 'Convert KMN Project to LDML';
    lblConversionFormat.Caption := 'Converting: KMN → LDML';
    lblFormatDescription.Caption := 'This will convert your KMN-based keyboard project to LDML format.';
  end
  else
  begin
    Caption := 'Convert LDML Project to KMN';
    lblConversionFormat.Caption := 'Converting: LDML → KMN';
    lblFormatDescription.Caption := 'This will convert your LDML keyboard project to KMN format.' + sLineBreak +
      'Note: Generated KMN code should be manually reviewed.';
  end;
end;

function TfrmConvertProjectParameters.Validate: Boolean;
var
  DestFolder: string;
  ProjectId: string;
begin
  Result := True;

  if not FileExists(editSourceProject.Text) then
  begin
    ShowMessage('The source project file does not exist.');
    Exit(False);
  end;

  if not DirectoryExists(editDestinationFolder.Text) then
  begin
    if MessageDlg('The destination folder ' + editDestinationFolder.Text + ' does not exist. Create it now?',
        mtConfirmation, mbOkCancel, 0) = mrCancel then
      Exit(False);
  end;

  // Check if destination already has content
  ProjectId := ChangeFileExt(ExtractFileName(editSourceProject.Text), '');
  DestFolder := IncludeTrailingPathDelimiter(editDestinationFolder.Text) + ProjectId;

  if DirectoryExists(DestFolder) then
  begin
    if MessageDlg('The destination folder ' + DestFolder + ' already exists. ' +
        'Contents may be overwritten. Continue?',
        mtWarning, mbOkCancel, 0) = mrCancel then
      Exit(False);
  end;
end;

end.
