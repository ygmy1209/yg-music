; ------------------------------------------------------------------
; 兼容性修复（不改动任何业务逻辑，只影响安装器自身）：
; electron-builder 默认会在“按当前用户安装”时用 NSIS System 插件调用
; SHGetKnownFolderPath 来取 %LOCALAPPDATA%\Programs。该调用在部分新版
; Windows（如 Windows 11 24H2/25H2，内部版本 26200）上会概率性触发
; 访问违例，导致安装器双击后直接静默退出。
; 这里在安装器初始化最开始就把该注册表值写成与系统默认完全一致的路径，
; 使安装器走“已有安装路径”分支，从而完全跳过那次调用。
; 路径与 electron-builder 原本计算出的默认路径一致，用户仍可在安装向导中
; 自由更改安装目录。
; ------------------------------------------------------------------
!macro preInit
  ReadRegStr $0 HKCU "Software\${APP_GUID}" InstallLocation
  ${If} $0 == ""
    WriteRegStr HKCU "Software\${APP_GUID}" InstallLocation "$LOCALAPPDATA\Programs\${APP_FILENAME}"
  ${EndIf}
!macroend

; ============================================================
;  YG Music · Windows 安装向导自定义脚本
;
;  本文件仅在 electron-builder 生成 NSIS 安装包时被引用，
;  属于“安装程序”的一部分，不参与应用运行逻辑，
;  也不影响应用界面与业务功能。
;
;  作用：
;   1) 增加“欢迎”页；
;   2) 在“选择安装位置”之后增加“附加任务”页，
;      由用户选择是否创建桌面快捷方式（默认创建）；
;   3) 默认按当前用户安装，普通用户双击即可安装，
;      不会弹出管理员权限（UAC）提示。
; ============================================================

!include "LogicLib.nsh"

; 是否创建桌面快捷方式：1=创建（默认），0=不创建
; 卸载程序（BUILD_UNINSTALLER 编译）用不到这些变量，必须放在条件里，
; 否则 makensis 会报 "variable not referenced" 警告，而打包时警告即错误。
!ifndef BUILD_UNINSTALLER
  Var YgCreateDesktopShortcut
  Var YgShortcutCheckBox
!endif

; 初始化默认值：静默安装（/S）不会显示页面，此时按默认值创建桌面快捷方式
!macro customInit
  StrCpy $YgCreateDesktopShortcut "1"
!macroend

; 默认按当前用户安装（跳过“为所有用户 / 仅为我”选择页）
!macro customInstallMode
  StrCpy $isForceCurrentInstall "1"
!macroend

; 欢迎页（同时覆盖“选定安装位置”页的说明文字）
!macro customWelcomePage
  ; NSIS 官方简体中文语言文件里这句开头是英文单词 “Setup”，
  ; 这里覆盖成纯中文（本安装器只提供简体中文界面）。
  !define MUI_DIRECTORYPAGE_TEXT_TOP "安装程序将把 $(^NameDA) 安装到下面的文件夹。要安装到其他文件夹，请单击［浏览(B)...］并选择文件夹。$\r$\n$\r$\n单击［下一步(N)］继续。"
  !insertmacro MUI_PAGE_WELCOME
!macroend

; “选择安装位置”之后的附加任务页
!macro customPageAfterChangeDir
  !insertmacro YgShortcutPage
!macroend

!macro YgShortcutPage
  Page custom YgShortcutPageCreate YgShortcutPageLeave

  Function YgShortcutPageCreate
    !insertmacro MUI_HEADER_TEXT "选择附加任务" "请选择安装程序需要执行的附加任务，然后点击“下一步”继续。"

    nsDialogs::Create 1018
    Pop $0
    ${If} $0 == error
      Abort
    ${EndIf}

    ${NSD_CreateLabel} 0 0 100% 24u "安装程序会在桌面上创建 YG Music 的快捷方式，方便你随时启动；如不需要，请取消下面的勾选。"
    Pop $0

    ${NSD_CreateCheckBox} 0 30u 100% 12u "创建桌面快捷方式(&D)"
    Pop $YgShortcutCheckBox
    ${If} $YgCreateDesktopShortcut == "1"
      ${NSD_SetState} $YgShortcutCheckBox ${BST_CHECKED}
    ${EndIf}

    nsDialogs::Show
  FunctionEnd

  Function YgShortcutPageLeave
    ${NSD_GetState} $YgShortcutCheckBox $0
    ${If} $0 == ${BST_CHECKED}
      StrCpy $YgCreateDesktopShortcut "1"
    ${Else}
      StrCpy $YgCreateDesktopShortcut "0"
    ${EndIf}
  FunctionEnd
!macroend

; 安装过程结束时：若用户取消了桌面快捷方式，则删除安装程序刚创建的快捷方式
!macro customInstall
  ${If} $YgCreateDesktopShortcut != "1"
    Delete "$newDesktopLink"
    ClearErrors
  ${EndIf}
!macroend
