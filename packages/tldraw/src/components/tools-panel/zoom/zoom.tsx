import * as React from 'react'
import { ZoomInIcon, ZoomOutIcon } from '@radix-ui/react-icons'
import { TertiaryButton, tertiaryButtonsContainer } from '~components/tools-panel/styled'
import { useTLDrawContext } from '~hooks'
import type { Data } from '~types'

export const Zoom = React.memo((): JSX.Element => {
  const { tlstate } = useTLDrawContext()

  return (
    <div className={tertiaryButtonsContainer({ bp: { '@initial': 'mobile', '@sm': 'small' } })}>
      <TertiaryButton label="Zoom Out" kbd={`#−`} onClick={tlstate.zoomOut}>
        <ZoomOutIcon />
      </TertiaryButton>
      <TertiaryButton label="Zoom In" kbd={`#+`} onClick={tlstate.zoomIn}>
        <ZoomInIcon />
      </TertiaryButton>
      <ZoomCounter />
    </div>
  )
})

const zoomSelector = (s: Data) => s.document.pageStates[s.appState.currentPageId].camera.zoom

function ZoomCounter() {
  const { tlstate, useSelector } = useTLDrawContext()
  const zoom = useSelector(zoomSelector)

  return (
    <TertiaryButton
      label="Reset Zoom"
      kbd="⇧0"
      onClick={tlstate.zoomToActual}
      onDoubleClick={tlstate.zoomToFit}
    >
      {Math.round(zoom * 100)}%
    </TertiaryButton>
  )
}