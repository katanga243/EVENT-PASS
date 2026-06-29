export default function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div
        className="w-8 h-8 rounded-full border-[3px] animate-spin"
        style={{ borderColor: "#e6e9f1", borderTopColor: "#1452f0" }}
      />
    </div>
  );
}
