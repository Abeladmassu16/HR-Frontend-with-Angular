import { Directive, HostListener, ElementRef, Renderer2 } from '@angular/core';

@Directive({ selector: '[elevateOnHover]' })
export class ElevateOnHoverDirective {
  private cls = 'mat-elevation-z8';
  constructor(private el: ElementRef, private rnd: Renderer2) {}
  @HostListener('mouseenter') onEnter() { this.rnd.addClass(this.el.nativeElement, this.cls); }
  @HostListener('mouseleave') onLeave() { this.rnd.removeClass(this.el.nativeElement, this.cls); }
}
