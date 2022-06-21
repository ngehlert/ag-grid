import { Path } from "../scene/shape/path";
import { Group } from "../scene/group";
import { FontStyle, FontWeight } from "../scene/shape/text";
import { PointerEvents } from "../scene/node";
import { Scale } from "../scale/scale";
import { createId } from "../util/id";
import { Series } from "./series/series";

export class CrossLineLabel {
    text?: string = undefined;
    fontStyle?: FontStyle;
    fontWeight?: FontWeight;
    fontSize: number;
    fontFamily: string;
    /**
     * The padding between the label and the line.
     */
    padding: number;
    /**
     * The color of the labels.
     * Use `undefined` rather than `rgba(0, 0, 0, 0)` to make labels invisible.
     */
    color?: string;
    position: 'start' | 'middle' | 'end';
}
export class CrossLineStyle {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    lineDash?: [];
}
interface CrossLinePathData {
    readonly points: {
        readonly x: number;
        readonly y: number;
    }[];
}
export class CrossLine {

    protected static readonly ANNOTATION_LAYER_ZINDEX = Series.SERIES_LAYER_ZINDEX + 20;

    static className = "CrossLine";
    readonly id = createId(this);

    kind?: "line" | "range" = undefined;
    range?: [any, any] = undefined;
    value?: any = undefined;
    fill?: string = undefined;
    fillOpacity?: number = undefined;
    stroke?: string = undefined;
    strokeWidth?: number = undefined;
    strokeOpacity?: number = undefined;
    lineDash?: [] = undefined;
    label?: CrossLineLabel = new CrossLineLabel();

    scale?: Scale<any, number> = undefined;
    gridLength: number = 0;
    sideFlag: 1 | -1 = -1;

    readonly group = new Group({ name: `${this.id}`, layer: true, zIndex: CrossLine.ANNOTATION_LAYER_ZINDEX });
    private crossLineLine: Path = new Path();
    private crossLineRange: Path = new Path();
    private pathData?: CrossLinePathData = undefined;

    constructor() {
        const { group, crossLineLine, crossLineRange } = this;

        group.append([crossLineRange, crossLineLine]);

        crossLineLine.fill = undefined;
        crossLineLine.pointerEvents = PointerEvents.None;

        crossLineRange.pointerEvents = PointerEvents.None;
    }

    update(visible: boolean) {
        if (!this.kind) { return; }

        this.group.visible = visible;

        if (!visible) { return; }

        this.createNodeData();
        this.updatePaths();
    }

    private updatePaths() {
        this.updateLinePath();
        this.updateLineNode();

        if (this.kind === 'range') {
            this.updateRangePath();
            this.updateRangeNode();
        }
    }

    private createNodeData() {
        const { scale, gridLength, sideFlag, range, value } = this;

        if (!scale) { return; }

        const halfBandWidth = (scale.bandwidth || 0) / 2;

        let xStart, xEnd, yStart, yEnd;
        this.pathData = { points: [] };

        [xStart, xEnd] = [0, -sideFlag * gridLength];
        [yStart, yEnd] = range || [value, undefined];
        [yStart, yEnd] = [scale.convert(yStart) + halfBandWidth, scale.convert(yEnd) + halfBandWidth];

        this.pathData.points.push(
            {
                x: xStart,
                y: yStart
            },
            {
                x: xEnd,
                y: yStart
            },
            {
                x: xEnd,
                y: yEnd
            },
            {
                x: xStart,
                y: yEnd
            }
        );
    }

    private updateLinePath() {
        const { crossLineLine, pathData = { points: [] } } = this;
        const pathMethods: ('moveTo' | 'lineTo')[] = ['moveTo', 'lineTo', 'moveTo', 'lineTo'];
        const points = pathData.points;
        const { path } = crossLineLine;

        path.clear({ trackChanges: true });
        pathMethods.forEach((method, i) => {
            const { x, y } = points[i];
            path[method](x, y);
        })
        path.closePath();
        crossLineLine.checkPathDirty();
    }

    private updateLineNode() {
        const { crossLineLine, stroke, strokeWidth, lineDash } = this;
        crossLineLine.stroke = stroke;
        crossLineLine.strokeWidth = strokeWidth ?? 1;
        crossLineLine.opacity = this.strokeOpacity ?? 1;
        crossLineLine.lineDash = lineDash;
    }

    private updateRangeNode() {
        const { crossLineRange, fill, lineDash, fillOpacity } = this;
        crossLineRange.fill = fill;
        crossLineRange.opacity = fillOpacity ?? 1;
        crossLineRange.lineDash = lineDash;
    }

    private updateRangePath() {
        const { crossLineRange, pathData = { points: [] } } = this;
        const points = pathData.points;
        const { path } = crossLineRange;

        path.clear({ trackChanges: true });
        points.forEach((point, i) => {
            const { x, y } = point;
            path[i > 0 ? 'lineTo' : 'moveTo'](x, y);
        });
        path.closePath();
        crossLineRange.checkPathDirty();
    }
}