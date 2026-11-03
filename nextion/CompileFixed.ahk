; CompileFixed.ahk — sauvegarde le HMI ouvert puis l'exporte en TFT (menu application → « TFT file output »).
; Même correctif que UpdateImagesFixed.ahk : fenêtre activée avant chaque séquence clavier.
#include Helpers.ahk
#ErrorStdOut
SetTitleMatchMode, 2

ActivateEditor() {
  WinActivate, Nextion Editor(
  WinWaitActive, Nextion Editor(,, 10
  Sleep 500
}

ActivateEditor()
SendInput, ^s
Sleep 3000
ActivateEditor()
SendInput {Alt down}
Sleep 500
SendInput {Alt up}
Sleep 1000
SendInput {Enter}
Sleep 1000
SendInput {Enter}
Sleep 2000

FileAppend % "Save file `n", *
SaveButton := FindElement("AutomationId=buttonX2 AND Name=Output") ;
SaveButton.SetFocus() ;
SaveButton.Click("left") ;
FileAppend % "Wait for save to finish `n", *
ElementGone("AutomationId=buttonX2") ;
ExitApp
