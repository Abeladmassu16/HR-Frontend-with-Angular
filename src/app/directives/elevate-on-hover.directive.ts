import { Directive, HostListener, ElementRef, Renderer2 } from '@angular/core';
@Directive({ selector: '[elevateOnHover]' })
export class ElevateOnHoverDirective {
  private cls = 'mat-elevation-z8';
  constructor(private el: ElementRef, private r: Renderer2) {}
  @HostListener('mouseenter') onEnter() { this.r.addClass(this.el.nativeElement, this.cls); }
  @HostListener('mouseleave') onLeave()  { this.r.removeClass(this.el.nativeElement, this.cls); }
}
