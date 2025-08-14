import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';
@Directive({ selector: '[tiltCard]' })
export class TiltCardDirective {
  constructor(private el: ElementRef, private r: Renderer2) {
    this.r.setStyle(this.el.nativeElement, 'transformStyle', 'preserve-3d');
    this.r.setStyle(this.el.nativeElement, 'willChange', 'transform');
    this.r.setStyle(this.el.nativeElement, 'transform', 'perspective(900px)');
  }
  @HostListener('mousemove', ['$event'])
  onMove(e: MouseEvent) {
    const rect = this.el.nativeElement.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const rx = ((y / rect.height) - 0.5) * -6;
    const ry = ((x / rect.width)  - 0.5) *  6;
    this.r.setStyle(this.el.nativeElement, 'transform',
      `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`);
  }
  @HostListener('mouseleave') reset() {
    this.r.setStyle(this.el.nativeElement, 'transform', 'perspective(900px) rotateX(0) rotateY(0)');
  }
}
