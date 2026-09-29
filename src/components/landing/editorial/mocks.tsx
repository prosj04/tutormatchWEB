/**
 * 홈 랜딩 목업 — 실제 앱 화면을 종이 패널(1px 헤어라인)로 재현한 예시.
 * 문구는 v2와 동일하다(장식용 이모지만 제거 — v3 금지 항목).
 * 모두 aria-hidden 컨테이너 안에서만 쓰이는 비대화 요소다.
 */
import type { ReactNode } from "react";

function MockHead({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="lx-mock-head">
      <strong>{title}</strong>
      <span className="t">{meta}</span>
    </div>
  );
}

function MockRow({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="lx-mock-row">
      <span className="k">{k}</span>
      <span className="v">{v}</span>
    </div>
  );
}

function HomeworkRows({ rows }: { rows: [string, string, boolean][] }) {
  return (
    <div className="lx-mock-rows">
      {rows.map(([day, text, done]) => (
        <div key={`${day}-${text}`} className={`lx-hw-row${done ? " done" : ""}`}>
          <span className="d">{day}</span>
          <span className="v">{text}</span>
          <span className="c" aria-hidden="true">{done ? "✓" : ""}</span>
        </div>
      ))}
    </div>
  );
}

function QnaThread() {
  return (
    <div className="lx-qa">
      <div className="lx-qa-msg q">
        <span className="who">학생 질문</span>
        <p>꼭짓점 구하는 게 자꾸 헷갈려요.</p>
      </div>
      <div className="lx-qa-msg a">
        <span className="who">AI · 즉시 답변</span>
        <p>표준형으로 바꾸면 꼭짓점은 (p, q)예요.</p>
      </div>
      <div className="lx-qa-msg a">
        <span className="who">김서연 선생님</span>
        <p>부호만 조심하면 돼요. 다음 수업에 유형 더 풀어봐요.</p>
      </div>
    </div>
  );
}

function ParentGauge() {
  return (
    <>
      <div className="lx-gauge">
        <span className="lbl">이번 주 진도</span>
        <span className="pct num">82%</span>
      </div>
      <div className="lx-gauge-bar">
        <span style={{ width: "82%" }} />
      </div>
    </>
  );
}

/* ─── 프로세스 5단계 목업 ─── */
export const processMocks: { body: ReactNode; note: string }[] = [
  {
    body: (
      <>
        <MockHead title="상담 신청 접수" meta="오늘 14:02" />
        <p className="lx-mock-lede">담당 매니저가 24시간 안에 연락드립니다.</p>
      </>
    ),
    note: "이름 없이 연락처와 학년만으로 시작됩니다",
  },
  {
    body: (
      <>
        <MockHead title="선생님 배정 완료" meta="방문 상담 후" />
        <div className="lx-mock-rows" style={{ marginTop: 12 }}>
          <MockRow k="진단" v="조용·신중형 · 내신 수학 2등급 목표" />
          <MockRow k="선생님" v="김서연 · 서울대 수리과학부 · 기다려주는 수업" />
          <MockRow k="첫 수업" v="목요일 19:00 · 자택 방문" />
        </div>
        <button type="button" className="lx-mock-btn" tabIndex={-1}>
          이 선생님으로 수락하기
        </button>
      </>
    ),
    note: "방문 진단으로 성향까지 맞춘 선생님을 배정합니다",
  },
  {
    body: (
      <>
        <MockHead title="오늘의 숙제" meta="요일별 자동 배분" />
        <HomeworkRows
          rows={[
            ["월", "유형 3 · 8문항", true],
            ["화", "오답 정리 · 5문항", true],
            ["수", "유형 4 · 8문항", false],
          ]}
        />
        <div className="lx-mock-sub">
          <QnaThread />
        </div>
      </>
    ),
    note: "숙제는 요일별 자동 배분, 질문은 AI·선생님 2단 답변",
  },
  {
    body: (
      <>
        <MockHead title="Concord 학부모 앱" meta="실시간" />
        <div style={{ marginTop: 14 }}>
          <ParentGauge />
        </div>
        <div className="lx-mock-rows" style={{ marginTop: 16 }}>
          <MockRow k="리포트" v="수업 리포트 · 3/15" />
          <MockRow k="숙제" v="숙제 완료 5/6" />
        </div>
        <button type="button" className="lx-mock-btn" tabIndex={-1}>
          월간 리포트 보기 →
        </button>
      </>
    ),
    note: "수업·월간 리포트를 학부모 앱에서 언제든 확인",
  },
  {
    body: (
      <>
        <MockHead title="매니저 사후 관리" meta="배정 이후 상시" />
        <div className="lx-mock-rows" style={{ marginTop: 12 }}>
          <MockRow k="관리" v="매니저 상시 점검 · 언제든 상담 요청" />
          <MockRow k="재매칭" v="맞지 않으면 비용 0원 교체" />
        </div>
      </>
    ),
    note: "배정 이후에도 매니저가 끝까지 함께합니다",
  },
];

/* ─── 학습 관리 목업 (0 수업리포트 · 1 월간리포트 · 2 학부모앱 · 3 숙제 · 4 질문) ─── */
export const careMocks: ReactNode[] = [
  <>
    <MockHead title="수업 리포트" meta="매 수업 직후" />
    <div className="lx-mock-rows" style={{ marginTop: 12 }}>
      <MockRow k="진도" v="이차함수 그래프 활용 (교재 p.84~91)" />
      <MockRow k="숙제" v="유형 연습 12문항 · 요일별 배분" />
      <MockRow k="다음 수업" v="목요일 19:00 방문" />
    </div>
    <p className="lx-mock-foot">수업이 끝날 때마다 바로 보내드립니다</p>
  </>,
  <>
    <MockHead title="월간 상세 리포트" meta="6월 리포트" />
    <div className="lx-mock-rows" style={{ marginTop: 12 }}>
      <MockRow k="이달 진도" v="이차함수 그래프 활용 (교재 p.84~91)" />
      <MockRow k="취약 유형" v="범위 조건 누락 · 계산 실수" />
      <MockRow
        k="선생님 코멘트"
        v="응용 문제에 접근하는 방식이 눈에 띄게 좋아졌습니다. 다음 달은 실수 유형을 함께 줄여보겠습니다."
      />
    </div>
    <p className="lx-mock-foot">매월 선생님이 직접 작성해 학부모님께 전달됩니다</p>
  </>,
  <>
    <div className="lx-mock-rows" style={{ marginTop: 0 }}>
      <MockRow k="리포트" v="수업 리포트 · 3/15" />
      <MockRow k="숙제" v="숙제 완료 5/6" />
      <MockRow k="성취도" v="이번 달 성취도 상승" />
    </div>
    <div style={{ marginTop: 16 }}>
      <ParentGauge />
    </div>
    <button type="button" className="lx-mock-btn" tabIndex={-1}>
      월간 리포트 보기 →
    </button>
  </>,
  <>
    <MockHead title="이번 주 숙제" meta="요일별 자동 배분" />
    <HomeworkRows
      rows={[
        ["월", "유형 3 · 8문항", true],
        ["화", "오답 정리 · 5문항", true],
        ["수", "유형 4 · 8문항", false],
        ["목", "복습 · 6문항", false],
      ]}
    />
  </>,
  <>
    <QnaThread />
  </>,
];
