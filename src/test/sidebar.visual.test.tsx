import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import {
  Sidebar,
  SidebarProvider,
  SidebarMenuSub,
} from "@/components/ui/sidebar";

/**
 * "Visual" contract test: guarantees the classes that drive the redesign
 * (curva na base, base compacta, tracinhos mais próximos) stay in place.
 * A regressão em qualquer uma dessas classes quebra a UX pedida pelo usuário.
 */
describe("Sidebar · visual contract", () => {
  it("inner container has rounded-br + shadow for the curve", () => {
    // Simulate desktop so the desktop branch renders (Sheet is mobile).
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: () => ({
        matches: false,
        media: "",
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });

    const { container } = render(
      <SidebarProvider>
        <Sidebar>
          <div>content</div>
        </Sidebar>
      </SidebarProvider>
    );

    const inner = container.querySelector('[data-sidebar="sidebar"]');
    expect(inner, "sidebar inner container not found").not.toBeNull();
    const cls = inner!.className;
    expect(cls).toMatch(/rounded-br-2xl|rounded-bl-2xl/);
    expect(cls).toMatch(/shadow-lg/);
  });

  it("base is compacted (pb-3 on fixed wrapper)", () => {
    const { container } = render(
      <SidebarProvider>
        <Sidebar>
          <div>content</div>
        </Sidebar>
      </SidebarProvider>
    );
    const fixed = container.querySelector(".fixed.inset-y-0");
    expect(fixed).not.toBeNull();
    expect(fixed!.className).toMatch(/\bpb-3\b/);
  });

  it("submenu rail uses tighter horizontal spacing (mx-1.5, pl-1.5)", () => {
    const { container } = render(
      <ul>
        <SidebarMenuSub>
          <li>item</li>
        </SidebarMenuSub>
      </ul>
    );
    const sub = container.querySelector('[data-sidebar="menu-sub"]');
    expect(sub, "menu-sub not found").not.toBeNull();
    expect(sub!.className).toMatch(/mx-1\.5/);
    expect(sub!.className).toMatch(/pl-1\.5/);
  });
});
