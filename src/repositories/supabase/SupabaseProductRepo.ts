import type { Product } from '@/src/domain/types';
import type { ProductRepo } from '@/src/repositories/interfaces';
import { maybeRow, requireRow, rows } from '@/src/repositories/supabase/_util';
import { getServiceClient } from '@/src/repositories/supabase/client';
import {
  compact,
  productFromRow,
  productToRow,
  type Row,
} from '@/src/repositories/supabase/mappers';

const TABLE = 'products';

export class SupabaseProductRepo implements ProductRepo {
  async getById(id: string): Promise<Product | null> {
    const res = await getServiceClient().from(TABLE).select('*').eq('id', id).single();
    const row = maybeRow(res as never, 'products.getById');
    return row ? productFromRow(row) : null;
  }

  async getBySlug(slug: string): Promise<Product | null> {
    const res = await getServiceClient()
      .from(TABLE)
      .select('*')
      .eq('slug', slug.trim().toLowerCase())
      .single();
    const row = maybeRow(res as never, 'products.getBySlug');
    return row ? productFromRow(row) : null;
  }

  async list(filter?: Partial<Product>): Promise<Product[]> {
    let q = getServiceClient().from(TABLE).select('*');
    for (const [col, value] of Object.entries(productToRow(filter ?? {}))) {
      q = q.eq(col, value as never);
    }
    const res = await q.order('created_at', { ascending: false });
    return rows(res as never, 'products.list').map(productFromRow);
  }

  async create(p: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    const res = await getServiceClient()
      .from(TABLE)
      .insert(productToRow(p as Partial<Product>))
      .select('*')
      .single();
    return productFromRow(requireRow(res as never, 'products.create', 'inserted row'));
  }

  async update(id: string, patch: Partial<Product>): Promise<Product> {
    const changes = compact(productToRow(patch) as Row);
    delete changes.id;
    const res = await getServiceClient()
      .from(TABLE)
      .update(changes)
      .eq('id', id)
      .select('*')
      .single();
    return productFromRow(requireRow(res as never, 'products.update', id));
  }
}
