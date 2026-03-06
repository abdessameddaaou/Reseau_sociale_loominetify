import { Directive, ElementRef, Input, OnChanges } from '@angular/core';

/**
 * Directive pour assigner srcObject sur les éléments <audio> et <video>.
 * Angular ne peut pas gérer srcObject via le binding standard [srcObject]
 * car MediaStream n'est pas comparable par Angular → erreurs NG0900/NG0901
 * et le son ne joue pas. Cette directive assigne la valeur impérativement.
 */
@Directive({
    selector: '[appSrcObject]',
    standalone: true
})
export class SrcObjectDirective implements OnChanges {
    @Input('appSrcObject') srcObject: MediaStream | null = null;

    constructor(private el: ElementRef<HTMLMediaElement>) {}

    ngOnChanges() {
        const el = this.el.nativeElement;
        if (el.srcObject !== this.srcObject) {
            el.srcObject = this.srcObject;
        }
    }
}
