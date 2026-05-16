"use client";

import { motion } from "framer-motion";

const PARAGRAPHS = [
  "어떤 아이에게는 따뜻하게 기다려주는 선생님이 필요하고,\n어떤 아이에게는 함께 웃으며 달려가줄 선생님이 필요합니다.",
  "누군가는 엄격한 훈련으로 성장하고,\n누군가는 존경하는 어른의 한마디에 인생이 바뀝니다.",
  "우리는 성적표가 아닌 아이를 봅니다.\n그 아이에게 꼭 맞는 한 명의 선생님을 찾아드리기 위해,\n매니저가 직접 만나고, 직접 고릅니다.",
];

function GoldLine() {
  return <div className="mx-auto h-0.5 w-[60px] bg-gold" aria-hidden />;
}

export function Philosophy() {
  return (
    <section className="bg-[#F8F8F6] px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[800px] text-center">
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <GoldLine />
        </motion.div>

        <div className="mt-12 space-y-10">
          {PARAGRAPHS.map((text, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.5, delay: i * 0.3 }}
              className="whitespace-pre-line font-sans text-lg leading-[1.9] text-navy md:text-xl"
            >
              {text}
            </motion.p>
          ))}
        </div>

        <motion.div
          className="mt-12"
          initial={{ opacity: 0, scaleX: 0 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <GoldLine />
        </motion.div>
      </div>
    </section>
  );
}
