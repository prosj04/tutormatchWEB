import { listParentPayments } from "@/lib/parent-data";
import { requireParentPage } from "@/lib/parent-page-auth";

export const dynamic = "force-dynamic";

function formatAmount(amount: number | null): string {
  return `${(amount ?? 0).toLocaleString("ko-KR")}원`;
}

function formatDate(d: Date | null): string {
  return d ? new Date(d).toLocaleDateString("ko-KR") : "-";
}

export default async function ParentPaymentsPage() {
  const { parent } = await requireParentPage();
  const groups = await listParentPayments(parent.id);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-base font-semibold">결제·청구 이력</h2>
      {groups.length === 0 ? (
        <p className="text-sm text-gray-500">연결된 자녀가 없습니다.</p>
      ) : (
        groups.map((group) => (
          <section key={group.studentId} className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">{group.studentName}</h3>
            {group.payments.length === 0 ? (
              <p className="text-sm text-gray-500">결제 이력이 없습니다.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {group.payments.map((p) => (
                  <li
                    key={p.orderId}
                    className="flex items-center justify-between rounded border p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{p.plan}</p>
                      <p className="text-gray-500">
                        {formatDate(p.completedAt ?? p.createdAt)} · {p.status}
                      </p>
                    </div>
                    <div className="text-right">
                      <p>{formatAmount(p.amount)}</p>
                      {p.cashReceiptUrl && (
                        <a
                          href={p.cashReceiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-700 hover:underline"
                        >
                          현금영수증
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))
      )}
    </div>
  );
}
