/**
 * RN FormData 파일 파트 — 로컬 uri에서 파일명/MIME을 유추한다.
 * 업로드 화면이 여럿이라(강사 서류·프로필 사진·질문 첨부) 한 곳에 둔다.
 */
export function filePart(uri: string, name: string | null | undefined, mime?: string | null) {
  const fallbackName = uri.split("/").pop() || "upload";
  const fileName = name || fallbackName;
  const ext = fileName.split(".").pop()?.toLowerCase();
  const type =
    mime || (ext === "png" ? "image/png" : ext === "pdf" ? "application/pdf" : "image/jpeg");
  return { uri, name: fileName, type } as unknown as Blob;
}
