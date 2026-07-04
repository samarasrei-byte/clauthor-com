import { motion } from "framer-motion";
import { SplineScene } from "@/components/ui/splite";
import { Card } from "@/components/ui/card";
import { Spotlight } from "@/components/ui/spotlight";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { Sparkles } from "@/components/icons/Sparkles";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface SplineShowcaseProps {
  variant?: "home" | "waitlist";
}

const SplineShowcase = ({ variant = "home" }: SplineShowcaseProps) => {
  const { t } = useTranslation();

  return (
    <section className="py-10 sm:py-16 px-4 relative" aria-label="3D Showcase">
      <div className="max-w-6xl mx-auto">
        <Card className="relative overflow-hidden border-border/30 bg-card/40 backdrop-blur-xl">
          <Spotlight
            className="-top-40 left-0 md:left-60 md:-top-20"
            fill="hsl(0 85% 55% / 0.15)"
          />

          <div className="flex flex-col lg:flex-row min-h-[400px] sm:min-h-[480px]">
            {/* Left content */}
            <div className="flex-1 p-8 sm:p-10 lg:p-14 relative z-10 flex flex-col justify-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/10 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.5} />
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary/70">
                    {t("spline.tag", { defaultValue: "NEXT-GEN AI PLATFORM" })}
                  </span>
                </div>

                <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold leading-[1.1] mb-4">
                  <span className="text-foreground">
                    {t("spline.title_1", { defaultValue: "O futuro não espera." })}
                  </span>
                  <br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary-glow to-primary">
                    {t("spline.title_2", { defaultValue: "Sua empresa também não deveria." })}
                  </span>
                </h2>

                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md mb-8">
                  {t("spline.desc", {
                    defaultValue:
                      "Agentes de IA autônomos que trabalham 24/7 - vendendo, atendendo e escalando seu negócio enquanto você foca no que importa.",
                  })}
                </p>

                {variant === "home" && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link to="/waitlist">
                      <Button className="glow gap-2 px-6">
                        {t("spline.cta", { defaultValue: "Join the Waitlist" })}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <a href="https://www.g8prospect.com.br/agendar/60e4cd8d-5765-4902-a51b-87d5b9f025fe" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="gap-2 border-border/40">
                        {t("spline.cta_meeting", { defaultValue: "Agendar reunião" })}
                      </Button>
                    </a>
                  </div>
                )}

                {variant === "waitlist" && (
                  <a href="https://www.g8prospect.com.br/agendar/60e4cd8d-5765-4902-a51b-87d5b9f025fe" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="gap-2 border-primary/20 text-primary hover:bg-primary/5">
                      {t("spline.cta_meeting", { defaultValue: "Agendar reunião" })}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </a>
                )}
              </motion.div>
            </div>

            {/* Right content - Animated Visual */}
            <div className="flex-1 relative min-h-[300px] lg:min-h-0">
              <SplineScene className="w-full h-full" />
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-card/60 via-transparent to-transparent lg:bg-gradient-to-r lg:from-card/40 lg:via-transparent lg:to-transparent" />
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default SplineShowcase;
