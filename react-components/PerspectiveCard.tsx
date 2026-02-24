import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion';

export type PerspectiveCardProps = {
  title?: string;
  tags?: string[];
  screens?: string[];
  className?: string;
};

export default function PerspectiveCard({
  title = 'KOHLER X SCADPRO - FUTURE OF HYDROTHERAPY',
  tags = ['Lead UXD', 'UXR', 'Product Design'],
  screens = [
    '/assets/images/kohler-scadpro.jpg',
    '/assets/images/7west.jpg',
    '/assets/images/google-nest.jpg',
    '/assets/images/word-clock.jpg'
  ],
  className = ''
}: PerspectiveCardProps) {
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  // Required ranges: rotateX 15 -> -15, rotateY -15 -> 15
  const rotateXRaw = useTransform(mouseY, [0, 1], [15, -15]);
  const rotateYRaw = useTransform(mouseX, [0, 1], [-15, 15]);

  // Required spring config
  const rotateX = useSpring(rotateXRaw, { stiffness: 150, damping: 20 });
  const rotateY = useSpring(rotateYRaw, { stiffness: 150, damping: 20 });

  const glareX = useTransform(mouseX, [0, 1], ['0%', '100%']);
  const glareY = useTransform(mouseY, [0, 1], ['0%', '100%']);
  const glare = useMotionTemplate`radial-gradient(460px circle at ${glareX} ${glareY}, rgba(255,255,255,0.24), rgba(255,255,255,0) 58%)`;

  const [screenA, screenB, screenC, screenD] = screens;

  return (
    <div className={`relative perspective-[1000px] ${className}`}>
      <motion.div
        className="relative mx-auto w-full max-w-[680px] rounded-3xl border border-white/10 bg-zinc-950 p-4 md:p-5"
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width;
          const y = (event.clientY - rect.top) / rect.height;
          mouseX.set(Math.min(1, Math.max(0, x)));
          mouseY.set(Math.min(1, Math.max(0, y)));
        }}
        onMouseLeave={() => {
          mouseX.set(0.5);
          mouseY.set(0.5);
        }}
      >
        {/* Dynamic glare / sheen */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-3xl"
          style={{ background: glare, mixBlendMode: 'screen' }}
        />

        {/* Parallax layers */}
        <div className="relative mb-4 overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f1320] via-[#0b1018] to-[#06080d] [transform-style:preserve-3d] min-h-[260px] md:min-h-[340px]">
          {screenA ? (
            <img
              src={screenA}
              alt="UI screen 1"
              className="absolute left-[4%] top-[8%] w-[66%] rounded-xl object-cover shadow-2xl [transform:translateZ(40px)]"
            />
          ) : null}
          {screenB ? (
            <img
              src={screenB}
              alt="UI screen 2"
              className="absolute right-[4%] top-[10%] w-[34%] rounded-xl object-cover shadow-2xl [transform:translateZ(80px)]"
            />
          ) : null}
          {screenC ? (
            <img
              src={screenC}
              alt="UI screen 3"
              className="absolute left-[34%] bottom-[8%] w-[44%] rounded-xl object-cover shadow-2xl [transform:translateZ(120px)]"
            />
          ) : null}
          {screenD ? (
            <img
              src={screenD}
              alt="UI screen 4"
              className="absolute right-[16%] bottom-[14%] w-[28%] rounded-xl object-cover shadow-2xl [transform:translateZ(160px)]"
            />
          ) : null}
        </div>

        {/* Bottom-aligned content */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xl font-semibold uppercase leading-tight text-white md:text-3xl">{title}</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white px-3 py-1 text-xs font-medium uppercase tracking-wide text-black md:text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
