inherited frmConvertProjectParameters: TfrmConvertProjectParameters
  BorderIcons = [biSystemMenu]
  BorderStyle = bsDialog
  Caption = 'Convert Keyboard Project'
  ClientHeight = 369
  ClientWidth = 585
  Position = poScreenCenter
  ExplicitWidth = 591
  ExplicitHeight = 398
  PixelsPerInch = 96
  TextHeight = 13
  object lblConversionFormat: TLabel
    Left = 16
    Top = 16
    Width = 121
    Height = 13
    Caption = 'Converting: KMN → LDML'
    Font.Charset = DEFAULT_CHARSET
    Font.Color = clWindowText
    Font.Height = -11
    Font.Name = 'Tahoma'
    Font.Style = [fsBold]
    ParentFont = False
  end
  object lblFormatDescription: TLabel
    Left = 16
    Top = 35
    Width = 553
    Height = 26
    AutoSize = False
    Caption =
      'This will convert your KMN-based keyboard project to LDML forma' +
      't.'
    WordWrap = True
  end
  object gbSourceProject: TGroupBox
    Left = 16
    Top = 67
    Width = 553
    Height = 73
    Caption = ' Source Project '
    TabOrder = 0
    object lblSourceProject: TLabel
      Left = 16
      Top = 24
      Width = 67
      Height = 13
      Caption = 'Project File:'
    end
    object editSourceProject: TEdit
      Left = 16
      Top = 43
      Width = 441
      Height = 21
      TabOrder = 0
      OnChange = editSourceProjectChange
    end
    object cmdBrowseSourceProject: TButton
      Left = 463
      Top = 41
      Width = 75
      Height = 25
      Caption = 'Browse...'
      TabOrder = 1
      OnClick = cmdBrowseSourceProjectClick
    end
  end
  object gbDestination: TGroupBox
    Left = 16
    Top = 146
    Width = 553
    Height = 73
    Caption = ' Destination '
    TabOrder = 1
    object lblDestinationFolder: TLabel
      Left = 16
      Top = 24
      Width = 100
      Height = 13
      Caption = 'Destination Folder:'
    end
    object editDestinationFolder: TEdit
      Left = 16
      Top = 43
      Width = 441
      Height = 21
      TabOrder = 0
      OnChange = editDestinationFolderChange
    end
    object cmdBrowseDestination: TButton
      Left = 463
      Top = 41
      Width = 75
      Height = 25
      Caption = 'Browse...'
      TabOrder = 1
      OnClick = cmdBrowseDestinationClick
    end
  end
  object gbOptions: TGroupBox
    Left = 16
    Top = 225
    Width = 553
    Height = 89
    Caption = ' Options '
    TabOrder = 2
    object chkCopyResources: TCheckBox
      Left = 16
      Top = 24
      Width = 521
      Height = 17
      Caption = 'Copy resource files (fonts, images, documentation)'
      Checked = True
      State = cbChecked
      TabOrder = 0
    end
    object chkUpdatePackage: TCheckBox
      Left = 16
      Top = 47
      Width = 521
      Height = 17
      Caption = 'Update package file (.kps)'
      Checked = True
      State = cbChecked
      TabOrder = 1
    end
  end
  object cmdOK: TButton
    Left = 413
    Top = 328
    Width = 75
    Height = 25
    Caption = 'Convert'
    Default = True
    Enabled = False
    ModalResult = 1
    TabOrder = 3
    OnClick = cmdOKClick
  end
  object cmdCancel: TButton
    Left = 494
    Top = 328
    Width = 75
    Height = 25
    Cancel = True
    Caption = 'Cancel'
    ModalResult = 2
    TabOrder = 4
  end
  object dlgBrowseSourceProject: TFileOpenDialog
    FavoriteLinks = <>
    FileTypes = <>
    Options = [fdoFileMustExist]
    Left = 464
    Top = 272
  end
end
