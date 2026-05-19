import Image from "next/image";

export type TestimonialItem = {
  quote: string;
  info: string;
  img: string;
};

export function TestimonialCard({ item }: { item: TestimonialItem }) {
  return (
    <article className="grid overflow-hidden rounded-[24px] border border-neutral-20 bg-neutral-10 shadow-sm md:grid-cols-[1fr_340px]">
      <div className="p-8 md:p-10">
        <svg width="40" height="32" viewBox="0 0 48 38" fill="none" className="text-primary">
          <path
            d="M18.5 0C7.8 5.1 1.7 12.8 0 23.1C-1.1 31.1 3.3 37.3 10.9 37.3C16.2 37.3 20.1 33.7 20.1 28.6C20.1 24 17.1 20.7 12.5 20.1C14 14.9 17.5 10.9 23 8L18.5 0ZM43.2 0C32.5 5.1 26.4 12.8 24.7 23.1C23.6 31.1 28 37.3 35.6 37.3C40.9 37.3 44.8 33.7 44.8 28.6C44.8 24 41.8 20.7 37.2 20.1C38.7 14.9 42.2 10.9 47.7 8L43.2 0Z"
            fill="currentColor"
          />
        </svg>
        <p className="mt-6 text-base font-bold leading-relaxed text-neutral-100 md:text-lg lg:text-xl">
          {item.quote}
        </p>
        <p className="mt-6 text-sm font-semibold text-neutral-50">{item.info}</p>
      </div>
      <div className="relative min-h-[240px]">
        <Image
          src={item.img}
          alt={item.info}
          fill
          className="object-cover"
          sizes="(max-width:768px) 100vw, 340px"
        />
      </div>
    </article>
  );
}
