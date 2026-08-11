import { GET as exportGET } from '@/app/api/v1/export/route';

export async function GET(req: Request) {
  return exportGET(req);
}
