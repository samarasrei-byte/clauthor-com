import { describe, it, expect, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
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

  it("dropdown Soluções lista as rotas primárias e omite as movidas ao footer", async () => {
    renderWithProviders(<Navbar />);
    const trigger = screen
      .getAllByRole("button")
      .find((b) => /soluç|solution/i.test(b.textContent ?? ""))!;
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    fireEvent.click(trigger);
    const menu = await screen.findByRole("menu");
    const scope = within(menu);
    expect(scope.getByRole("link", { name: /marketplace/i })).toHaveAttribute("href", "/marketplace");
    expect(scope.getByRole("link", { name: /enterprise/i })).toHaveAttribute("href", "/enterprise");
    expect(scope.queryByRole("link", { name: /art director/i })).toBeNull();
    expect(scope.queryByRole("link", { name: /api docs/i })).toBeNull();
  });
});

describe("Footer", () => {
  it("contém os links secundários movidos do navbar", () => {
    renderWithProviders(<Footer />);
    expect(screen.getByRole("link", { name: /art director/i })).toHaveAttribute("href", "/art-director");
    expect(screen.getByRole("link", { name: /api docs/i })).toHaveAttribute("href", "/api-docs");
    expect(
      screen.getByRole("link", { name: /community|comunidade/i }),
    ).toHaveAttribute("href", "/community");
  });
});
