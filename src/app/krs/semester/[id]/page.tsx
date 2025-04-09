import { PageLayout } from "@/components/page-layout";

export default function KrsPage() {
  return (
    <PageLayout>
      <div className="flex flex-col w-full h-full gap-4">
        <h1 className="text-2xl font-bold">KRS</h1>
        <p className="text-sm text-muted-foreground">
          Silahkan pilih semester untuk mengisi KRS
        </p>
      </div>
    </PageLayout>
  );
}
