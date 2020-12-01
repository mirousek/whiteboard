import {DRAWING_STATES} from "@/modules/Constants";

export class Position {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    x;
    y;
}

export class Stroke {
    constructor(drawingState) {
        this.drawingState = drawingState;
    }

    drawingState = DRAWING_STATES.None;
    positions = [];
}

export class MouseButtons {
    isPrimaryButtonPressed;
    isSecondaryButtonPressed;
    isAuxiliaryButtonPressed;
    isFourthButtonPressed;
    isFifthButtonPressed;

    constructor(isPrimaryButtonPressed, isSecondaryButtonPressed, isAuxiliaryButtonPressed, isFourthButtonPressed, isFifthButtonPressed) {
        this.isPrimaryButtonPressed = isPrimaryButtonPressed;
        this.isSecondaryButtonPressed = isSecondaryButtonPressed;
        this.isAuxiliaryButtonPressed = isAuxiliaryButtonPressed;
        this.isFourthButtonPressed = isFourthButtonPressed;
        this.isFifthButtonPressed = isFifthButtonPressed;

    }
}

