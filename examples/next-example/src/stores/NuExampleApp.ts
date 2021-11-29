/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  BoundsUtils,
  TLNuKeyboardHandler,
  TLNuPointerHandler,
  TLNuTargetType,
  TLNuWheelHandler,
  TLNuApp,
  TLNuStatus,
} from '@tldraw/next'
import Vec from '@tldraw/vec'
import type { NuBoxShape } from './NuBoxShape'

type Shape = NuBoxShape

export class NuExampleApp extends TLNuApp<Shape> {
  constructor() {
    super()
  }

  pointedShape?: Shape

  brushSnapshot?: {
    selectedIds: string[]
  }

  translateSnapshot?: {
    initialPoints: Record<string, number[]>
  }

  onPan: TLNuWheelHandler<Shape> = (info, e) => {
    this.onPointerMove(info, e as any)
  }

  onPointerEnter: TLNuPointerHandler<Shape> = (info, e) => {
    if (info.order > 0) return

    if (info.type === TLNuTargetType.Shape) {
      this.hoverShape(info.target)
    }
  }

  onPointerDown: TLNuPointerHandler<Shape> = (info, e) => {
    if (info.order > 0) return

    switch (info.type) {
      case TLNuTargetType.Shape: {
        if (this.selectedShapes.includes(info.target)) {
          this.pointedShape = info.target
          this.setStatus(TLNuStatus.PointingBounds)
        } else {
          this.select(info.target.id)
          this.setStatus(TLNuStatus.PointingShape)
        }
        break
      }
      case TLNuTargetType.Bounds: {
        this.setStatus(TLNuStatus.PointingBounds)
        break
      }
      case TLNuTargetType.Canvas: {
        this.deselectAll()
        this.setStatus(TLNuStatus.PointingCanvas)
        break
      }
    }
  }

  onPointerMove: TLNuPointerHandler<Shape> = (info, e) => {
    switch (this.status) {
      case TLNuStatus.PointingCanvas: {
        const { currentPoint, originPoint } = this.inputs
        if (Vec.dist(currentPoint, originPoint) > 5) {
          this.setStatus(TLNuStatus.Brushing)
          this.brushSnapshot = { selectedIds: [...this.selectedIds] }
        }
        break
      }
      case TLNuStatus.PointingBounds:
      case TLNuStatus.PointingShape: {
        const { currentPoint, originPoint } = this.inputs
        if (Vec.dist(currentPoint, originPoint) > 5) {
          this.setStatus(TLNuStatus.TranslatingShapes)
          this.translateSnapshot = {
            initialPoints: Object.fromEntries(
              this.selectedShapes.map((shape) => [shape.id, shape.point])
            ),
          }
        }
        break
      }
      case TLNuStatus.Brushing: {
        const { inputs } = this
        const { originPoint, currentPoint } = this.inputs

        const brushBounds = BoundsUtils.getBoundsFromPoints([currentPoint, originPoint], 0)

        this.setBrush(brushBounds)

        const hits = this.currentPage.shapes
          .filter((shape) =>
            inputs.ctrlKey
              ? BoundsUtils.boundsContain(brushBounds, shape.bounds)
              : shape.hitTestBounds(brushBounds)
          )
          .map((shape) => shape.id)

        this.select(
          ...(inputs.shiftKey
            ? Array.from(new Set([...this.brushSnapshot!.selectedIds, ...hits]).values())
            : hits)
        )
        break
      }
      case TLNuStatus.TranslatingShapes: {
        const { inputs } = this
        const { originPoint, currentPoint } = this.inputs

        const { initialPoints } = this.translateSnapshot!

        const delta = Vec.sub(currentPoint, originPoint)

        if (inputs.shiftKey) {
          if (Math.abs(delta[0]) < Math.abs(delta[1])) {
            delta[0] = 0
          } else {
            delta[1] = 0
          }
        }

        this.selectedShapes.forEach((shape) => {
          shape.update({ point: Vec.add(initialPoints[shape.id], delta) })
        })

        break
      }
    }
  }

  onPointerUp: TLNuPointerHandler<Shape> = (info, e) => {
    switch (this.status) {
      case TLNuStatus.PointingCanvas: {
        break
      }
      case TLNuStatus.PointingShape: {
        break
      }
      case TLNuStatus.PointingBounds: {
        if (this.pointedShape) {
          this.select(this.pointedShape.id)
        } else {
          this.select()
        }
        break
      }
      case TLNuStatus.Brushing: {
        this.brushSnapshot = undefined
        this.clearBrush()
        this.setStatus(TLNuStatus.Idle)
        break
      }
      case TLNuStatus.TranslatingShapes: {
        this.translateSnapshot = undefined
        break
      }
    }

    this.setStatus(TLNuStatus.Idle)
  }

  onPointerLeave: TLNuPointerHandler<Shape> = (info, e) => {
    if (info.order > 0) return

    if (info.type === TLNuTargetType.Shape) {
      if (this.hoveredId) {
        this.clearHoveredShape()
      }
    }
  }

  onKeyDown: TLNuKeyboardHandler<Shape> = (info, e) => {
    // noop
  }

  onKeyUp: TLNuKeyboardHandler<Shape> = (info, e) => {
    // noop
  }
}