import { motion } from "framer-motion";

/** Premium shimmer skeleton for dashboard sections */
const DashboardSkeleton = () => {
  const shimmer = "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/[0.04] before:to-transparent";

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Status bar skeleton */}
      <div className={`h-10 rounded-xl bg-card/40 border border-border/20 ${shimmer}`} />

      {/* Hero KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`rounded-2xl p-5 border border-border/20 bg-card/40 space-y-3 ${shimmer}`}
          >
            <div className="flex items-start justify-between">
              <div className="w-9 h-9 rounded-xl bg-muted/30" />
              <div className="w-16 h-5 rounded bg-muted/20" />
            </div>
            <div className="w-24 h-7 rounded bg-muted/25" />
            <div className="w-20 h-3 rounded bg-muted/15" />
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-5 gap-3">
        <div className={`lg:col-span-3 rounded-2xl p-5 border border-border/20 bg-card/40 ${shimmer}`}>
          <div className="w-32 h-4 rounded bg-muted/25 mb-4" />
          <div className="w-full h-[160px] rounded-xl bg-muted/10" />
        </div>
        <div className={`lg:col-span-2 rounded-2xl p-5 border border-border/20 bg-card/40 space-y-3 ${shimmer}`}>
          <div className="w-28 h-4 rounded bg-muted/25" />
          <div className="w-20 h-8 rounded bg-muted/20 mx-auto mt-6" />
          <div className="w-full h-2 rounded bg-muted/15 mt-4" />
          <div className="flex justify-between mt-2">
            <div className="w-16 h-3 rounded bg-muted/15" />
            <div className="w-16 h-3 rounded bg-muted/15" />
          </div>
        </div>
      </div>

      {/* Activity skeleton */}
      <div className={`rounded-2xl p-5 border border-border/20 bg-card/40 ${shimmer}`}>
        <div className="w-24 h-4 rounded bg-muted/25 mb-4" />
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-2.5">
              <div className="w-2 h-2 rounded-full bg-muted/25" />
              <div className="w-24 h-3 rounded bg-muted/20" />
              <div className="flex-1" />
              <div className="w-16 h-3 rounded bg-muted/15" />
              <div className="w-10 h-3 rounded bg-muted/15" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
