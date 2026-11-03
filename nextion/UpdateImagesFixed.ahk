; UpdateImagesFixed.ahk — UpdateImages.ahk de sztupy/nextion-editor-docker, avec un correctif :
; la fenêtre de l'éditeur est ACTIVÉE avant chaque séquence clavier. Sans ça (constaté le
; 2026-10-22), les touches Alt/Entrée du menu « TFT file output » se perdent et l'export échoue
; (« Could not find element AutomationId=buttonX2 AND Name=Output »).
; Usage : UpdateImagesFixed.ahk <extension> <dernier_slot>   (images C:\pics\0..N.<ext>)
#include Helpers.ahk
#ErrorStdOut
SetTitleMatchMode, 2

ActivateEditor() {
  WinActivate, Nextion Editor(
  WinWaitActive, Nextion Editor(,, 10
  Sleep 500
}

FileAppend Started processing`n, *

; Page « boot » sélectionnée
ClickElementAt("Page Panels", "AutomationId=colListBox1 AND IsEnabled=1", 10, 15) ;
Sleep 2000

; Suppression de toutes les images
FileAppend Deleting old images `n, *
PicturePanel := FindElement("AutomationId=picListBox0 AND IsEnabled=1")
PicturePanel.SetFocus() ;
Sleep 1000
PicturePanel.Click("right") ;
Sleep 1000
ClickElementAt("Image context options", "AutomationId=picListBox0 AND IsEnabled=1", 180, 145) ;

FileAppend Confirm to delete `n, *
Warning := FindElement("AutomationID=pp1 AND Name=Yes") ;
Warning.SetFocus() ;
Warning.Click("left") ;
Sleep 2000

; Import des slots 0..N
FileAppend Add images `n, *
PicturePanel.SetFocus() ;
PicturePanel.Click("right") ;
SendInput {Down}
Sleep 100
SendInput {Enter}

FileAppend Import dialog `n, *
Dialog := FindElement("LocalizedControlType=dialog AND Name=Open") ;
argv := GetArgs() ;
Extension := argv[1]
Amount := argv[2]
SendInput "C:\pics\0.png"{Space}
Sleep 100
Loop %Amount% {
    SendInput "C:\pics\%A_Index%.%Extension%"{Space}
    Sleep 100
}
Sleep 1000
SendInput {Enter}

FileAppend Waiting for import `n, *
Warning := FindElement("AutomationID=pp2 AND Name=OK") ;
Warning.SetFocus() ;
Warning.Click("left") ;
Sleep 3000

; Sauvegarde du HMI puis export TFT (menu application → 1er élément « TFT file output »)
ActivateEditor()
Click 250 250
Sleep 500
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
