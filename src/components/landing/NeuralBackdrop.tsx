/**
 * NeuralBackdrop — versão minimalista Apple/Tesla.
 * Fundo preto sólido + grid sutil + vinheta. Sem aurora, sem glow.
 */
interface Props {
  intensity?: number;
  className?: string;
}

const NeuralBackdrop = ({ className = "" }: Props) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden>
      {/* Base preta pura */}
      <div className="absolute inset-0 bg-[#050505]" />

      {/* Grid ultra sutil */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />

      {/* Vinheta bottom pra dar peso, sem cor */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black" />
    </div>
  );
};

export default NeuralBackdrop;
