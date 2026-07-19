import { describe, it, expect, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { ThemeProvider } from "@/hooks/useTheme";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Mock auth to a signed-out user so the public-facing links render.
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, isAdmin: false, signOut: vi.fn() }),
}));

const renderWithProviders = (ui: React.ReactElement) =>
  render(
    <HelmetProvider>
      <ThemeProvider>
        <I18nextProvider i18n={i18n}>
          <MemoryRouter>{ui}</MemoryRouter>
        </I18nextProvider>
      </ThemeProvider>
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

  it("dropdown 'Mais' lista Enterprise + Developers e omite rotas legadas", async () => {
    renderWithProviders(<Navbar />);
    const trigger = screen
      .getAllByRole("button")
      .find((b) => /mais|more/i.test(b.textContent ?? ""))!;
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    fireEvent.click(trigger);
    const menu = await screen.findByRole("menu");
    const scope = within(menu);
    expect(scope.getByRole("link", { name: /enterprise/i })).toHaveAttribute("href", "/enterprise");
    expect(scope.getByRole("link", { name: /developers/i })).toHaveAttribute("href", "/developers");
    expect(scope.queryByRole("link", { name: /marketplace/i })).toBeNull();
    expect(scope.queryByRole("link", { name: /art director/i })).toBeNull();
  });
});

describe("Footer", () => {
  it("contém os links canônicos de navegação secundária", () => {
    renderWithProviders(<Footer />);
    expect(screen.getByRole("link", { name: /enterprise/i })).toHaveAttribute("href", "/enterprise");
    expect(screen.getByRole("link", { name: /developers/i })).toHaveAttribute("href", "/developers");
    expect(screen.getByRole("link", { name: /pricing|preços/i })).toHaveAttribute("href", "/pricing");
  });
});
