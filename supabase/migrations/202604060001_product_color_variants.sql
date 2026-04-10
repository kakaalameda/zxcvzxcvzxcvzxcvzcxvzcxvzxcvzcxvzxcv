alter table public.product_colors
  add column if not exists stock_count integer not null default 0;

alter table public.product_sizes
  add column if not exists color_id bigint references public.product_colors(id) on delete cascade;

alter table public.product_images
  add column if not exists color_id bigint references public.product_colors(id) on delete set null;

create index if not exists product_sizes_color_id_idx
  on public.product_sizes(color_id, position);

create index if not exists product_images_color_id_idx
  on public.product_images(color_id, position);
