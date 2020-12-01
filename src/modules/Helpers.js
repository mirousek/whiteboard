import {MouseButtons} from "@/modules/Classes";

export function resolveMouseButtons(event) {
    return new MouseButtons(event.buttons & 1, event.buttons & 4, event.buttons & 2, event.buttons & 8, event.buttons & 16);
}
