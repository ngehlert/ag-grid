import { PointerEvents } from "../scene/node";
import { Group } from "../scene/group";
import { Path } from "../scene/shape/path";
import { Text, FontStyle, FontWeight } from "../scene/shape/text";
import { Scale } from "../scale/scale";
import { createId } from "../util/id";
import { Series } from "./series/series";
import { normalizeAngle360, toRadians } from "../util/angle";
import { ChartAxisDirection } from "./chartAxis";

export class CrossLineLabel {
    text?: string = undefined;
    fontStyle?: FontStyle = undefined;
    fontWeight?: FontWeight = undefined;
    fontSize: number = 15;
    fontFamily: string = 'Verdana, sans-serif';
    /**
     * The padding between the label and the line.
     */
    padding: number = 5;
    /**
     * The color of the labels.
     * Use `undefined` rather than `rgba(0, 0, 0, 0)` to make labels invisible.
     */
    color?: string = 'rgba(87, 87, 87, 1)';
    position?: CrossLineLabelPosition = undefined;
    rotation?: number = undefined;
    parallel?: boolean = undefined;
}

export type CrossLineLabelPosition =
    'top'
    | 'left'
    | 'right'
    | 'bottom'
    | 'inside'
    | 'insideLeft'
    | 'insideRight'
    | 'insideTop'
    | 'insideBottom'
    | 'insideTopLeft'
    | 'insideBottomLeft'
    | 'insideTopRight'
    | 'insideBottomRight';

export class CrossLineStyle {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    lineDash?: [];
}

interface Point {
    readonly x: number;
    readonly y: number;
}
interface CrossLinePathData {
    readonly points: Point[];
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
    label: CrossLineLabel = new CrossLineLabel();

    scale?: Scale<any, number> = undefined;
    gridLength: number = 0;
    sideFlag: 1 | -1 = -1;
    parallelFlipRotation: number = 0;
    regularFlipRotation: number = 0;
    direction: ChartAxisDirection = ChartAxisDirection.X;

    readonly group = new Group({ name: `${this.id}`, layer: true, zIndex: CrossLine.ANNOTATION_LAYER_ZINDEX });
    private crossLineLabel = new Text();
    private crossLineLine: Path = new Path();
    private crossLineRange: Path = new Path();
    private labelPoint?: Point = undefined;
    private pathData?: CrossLinePathData = undefined;

    constructor() {
        const { group, crossLineLine, crossLineRange, crossLineLabel } = this;

        group.append([crossLineRange, crossLineLine, crossLineLabel]);

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

        this.updateLabel();
        this.positionLabel();
    }

    private createNodeData() {
        const { scale, gridLength, sideFlag, direction, range, value, label: { position } } = this;

        if (!scale) { return; }

        const halfBandwidth = (scale.bandwidth || 0) / 2;

        let xStart, xEnd, yStart, yEnd;
        this.pathData = { points: [] };

        [xStart, xEnd] = [0, sideFlag * gridLength];
        [yStart, yEnd] = range || [value, undefined];
        [yStart, yEnd] = [scale.convert(yStart) + halfBandwidth, scale.convert(yEnd) + halfBandwidth];

        if (this.label.text) {
            let labelX;
            let labelY = yEnd ? (yStart + yEnd) / 2 : yStart;
            const labelYEnd = isNaN(yEnd) ? undefined : yEnd;
            if (direction === ChartAxisDirection.Y) {
                switch (position) {
                    case 'top': {
                        labelX = xEnd / 2;
                        labelY = labelYEnd ? Math.min(yStart, labelYEnd) : yStart;
                        break;
                    };
                    case 'bottom': {
                        labelX = xEnd / 2;
                        labelY = labelYEnd ? Math.max(yStart, labelYEnd) : yStart;
                        break;
                    }
                    case 'left': {
                        labelX = xStart;
                        labelY = yEnd ? (yStart + yEnd) / 2 : yStart;
                        break;
                    }
                    case 'right': {
                        labelX = xEnd;
                        labelY = yEnd ? (yStart + yEnd) / 2 : yStart;
                        break;
                    }
                    case 'inside': {
                        labelX = xEnd / 2;
                        labelY = yEnd ? (yStart + yEnd) / 2 : yStart;
                        break;
                    }
                    default: {
                        labelX = xEnd;
                        labelY = yEnd ? (yStart + yEnd) / 2 : yStart;
                    }
                }
            } else {
                switch (position) {
                    case 'top': {
                        labelX = xEnd;
                        labelY = yEnd ? (yStart + yEnd) / 2 : yStart;
                        break;
                    };
                    case 'bottom': {
                        labelX = xStart;
                        labelY = yEnd ? (yStart + yEnd) / 2 : yStart;
                        break;
                    }
                    case 'left': {
                        labelX = xEnd / 2;
                        labelY = labelYEnd ? Math.min(yStart, labelYEnd) : yStart;
                        break;
                    }
                    case 'right': {
                        labelX = xEnd / 2;
                        labelY = labelYEnd ? Math.max(yStart, labelYEnd) : yStart;
                        break;
                    }
                    case 'inside': {
                        labelX = xEnd / 2;
                        labelY = yEnd ? (yStart + yEnd) / 2 : yStart;
                        break;
                    }
                    default: {
                        labelX = xEnd / 2;
                        labelY = yEnd ? (yStart + yEnd) / 2 : yStart;
                    }
                }
            }
            this.labelPoint = {
                x: labelX,
                y: labelY
            }
        }

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

    private updateLabel() {
        const { crossLineLabel, label } = this;

        if (!label.text) { return; }

        crossLineLabel.fontStyle = label.fontStyle;
        crossLineLabel.fontWeight = label.fontWeight;
        crossLineLabel.fontSize = label.fontSize;
        crossLineLabel.fontFamily = label.fontFamily;
        crossLineLabel.fill = label.color;
        crossLineLabel.text = label.text;
    }

    private positionLabel() {
        const { crossLineLabel,
            labelPoint: {
                x = undefined,
                y = undefined
            } = {},
            label: {
                parallel,
                rotation,
                position,
            },
            parallelFlipRotation,
            regularFlipRotation,
        } = this;

        if (x === undefined || y === undefined) { return; }

        const labelRotation = rotation ? normalizeAngle360(toRadians(rotation)) : 0;

        const parallelFlipFlag = !labelRotation && parallelFlipRotation >= 0 && parallelFlipRotation <= Math.PI ? -1 : 1;
        const regularFlipFlag = !labelRotation && regularFlipRotation >= 0 && regularFlipRotation <= Math.PI ? -1 : 1;

        const autoRotation = parallel
            ? parallelFlipFlag * Math.PI / 2
            : (regularFlipFlag === -1 ? Math.PI : 0);

        let labelTextBaseline: CanvasTextBaseline;
        let labelTextAlign: CanvasTextAlign;

        switch (position) {
            case 'top': {
                labelTextBaseline = labelRotation ? 'middle' : 'bottom';
                labelTextAlign = labelRotation ? 'start' : 'center';
                break;
            };
            case 'bottom': {
                labelTextBaseline = labelRotation ? 'middle' : 'top';
                labelTextAlign = labelRotation ? 'end' : 'center';
                break;
            }
            case 'left': {
                labelTextBaseline = labelRotation ? 'top' : 'middle';
                labelTextAlign = labelRotation ? 'center' : 'end';
                break;
            }
            case 'right': {
                labelTextBaseline = labelRotation ? 'top' : 'middle';
                labelTextAlign = labelRotation ? 'center' : 'start';
                break;
            }
            case 'inside': {
                labelTextBaseline = 'middle';
                labelTextAlign = 'center';
                break;
            }
            default: {
                labelTextBaseline = 'middle';
                labelTextAlign = 'center';
            }
        }

        crossLineLabel.textBaseline = labelTextBaseline;
        crossLineLabel.textAlign = labelTextAlign;

        crossLineLabel.translationX = x;
        crossLineLabel.translationY = y;
        crossLineLabel.rotation = autoRotation + labelRotation;
    }
}