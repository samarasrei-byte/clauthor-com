import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Mock auth to a signed-out user so the public-facing links render.
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, isAdmin: false, signOut: vi.fn() }),
}));

const renderWithProviders = (ui: React.ReactElement) =>
  render(
    <HelmetProvider>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>{ui}</MemoryRouter>
      </I18nextProvider>
    </HelmetProvider>
  );

describe("Navbar", () => {
  it("logo aponta para a home com aria-label acessível", () => {
    renderWithProviders(<Navbar />);
    const home = screen.getByLabelText(/página inicial/i);
    expect(home).toHaveAttribute("href", "/");
  });

  it("botão mobile expõe aria-expanded/aria-label", () => {
    renderWithProviders(<Navbar />);
    const toggle = screen.getByRole("button", { name: /abrir menu/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", "mobile-nav-menu");
  });

  it("dropdown Soluções lista as 4 rotas primárias", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Navbar />);
    const trigger = screen.getAllByRole("button").find((b) =>
      /soluç|solution/i.test(b.textContent ?? "")
    )!;
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    await user.click(trigger);
    const menu = await screen.findByRole("menu");
    const scope = within(menu);
    expect(scope.getByRole("link", { name: /marketplace/i })).toHaveAttribute("href", "/marketplace");
    expect(scope.getByRole("link", { name: /enterprise/i })).toHaveAttribute("href", "/enterprise");
    // Itens movidos para o footer NÃO devem aparecer no dropdown.
    expect(scope.queryByRole("link", { name: /art director/i })).toBeNull();
    expect(scope.queryByRole("link", { name: /api docs/i })).toBeNull();
  });
});

describe("Footer", () => {
  it("contém os links secundários movidos do navbar", () => {
    renderWithProviders(<Footer />);
    const artDirector = screen.getByRole("link", { name: /art director/i });
    const apiDocs = screen.getByRole("link", { name: /api docs/i });
    expect(artDirector).toHaveAttribute("href", "/art-director");
    expect(apiDocs).toHaveAttribute("href", "/api-docs");
    expect(screen.getByRole("link", { name: /community|comunidade/i })).toHaveAttribute("href", "/community");
  });
});
