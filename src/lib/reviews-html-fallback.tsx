export const REVIEWS_HTML_FALLBACK = [
  {
    quote:
      "공부하러 가서도 시간만 보내던 아이가 처음으로 공부 계획을 직접 잡고 실행했어요. 정말 아이에 맞는 선생님을 찾아주셔서 안심됐습니다.",
    info: "고2 수학 · 학부모",
  },
  {
    quote:
      "방황하는 아들의 방향을 잡아 줄 선생님이 필요했는데, 정확히 맞는 분을 찾아줬어요. 아이가 선생님처럼 되고 싶다며 열심히 합니다.",
    info: "고3 수학 · 학부모",
  },
  {
    quote:
      "숙제와 공부 계획을 등록하고 선생님이랑 같이 점검하니 자연스럽게 매일 공부하게 됐어요. 성적보다 습관이 먼저 바뀌었어요.",
    info: "중3 영어 · 학생",
  },
  {
    quote:
      "매니저님이 중간중간 학습 상황을 공유해 주셔서 부모로서 믿고 맡길 수 있었어요. 리포트가 정말 꼼꼼합니다.",
    info: "고1 국어 · 학부모",
  },
  {
    quote:
      "질문하면 선생님이든 AI든 바로 답이 와서 막히는 부분이 쌓이지 않아요. 모르는 걸 미루지 않게 됐어요.",
    info: "중2 수학 · 학생",
  },
  {
    quote:
      "첫 선생님이 조금 안 맞았는데 바로 다른 분으로 다시 매칭해 주셨어요. 두 번째 선생님과는 정말 잘 맞아 성적이 올랐습니다.",
    info: "고2 영어 · 학부모",
  },
  {
    quote:
      "학원을 몇 번 옮겨도 안 되던 아이였는데, 1:1로 보니 어디서 막히는지 정확히 알게 됐어요. 화학 내신이 3등급에서 1등급이 됐습니다.",
    info: "고1 화학 · 학부모",
  },
  {
    quote:
      "계획표를 같이 짜고 매일 체크하니 공부가 습관이 됐어요. 시키지 않아도 책상에 앉는 모습이 신기합니다.",
    info: "중3 수학 · 학부모",
  },
  {
    quote:
      "국어 지문을 읽는 방법 자체를 훈련해 주셔서, 처음 보는 지문도 덜 두려워졌어요. 모의고사 등급이 안정적으로 올랐습니다.",
    info: "고3 국어 · 학생",
  },
] as const;

export type ReviewCardItem = { quote: string; info: string };

function parseByLine(info: string) {
  const idx = info.indexOf("·");
  if (idx === -1) return { bold: info, rest: null };
  return {
    bold: info.slice(0, idx).trim(),
    rest: info.slice(idx + 1).trim(),
  };
}

export function ReviewByLine({ info }: { info: string }) {
  const { bold, rest } = parseByLine(info);
  if (rest) {
    return (
      <div className="by">
        <b>{bold}</b> · {rest}
      </div>
    );
  }
  return (
    <div className="by">
      <b>{bold}</b>
    </div>
  );
}
