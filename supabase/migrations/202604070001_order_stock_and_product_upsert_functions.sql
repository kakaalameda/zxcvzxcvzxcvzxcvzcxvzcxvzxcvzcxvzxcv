create or replace function public.create_guest_order_with_stock(
  p_order_number text,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_province text,
  p_district text,
  p_ward text,
  p_address text,
  p_note text,
  p_payment_method text,
  p_voucher_code text,
  p_discount_pct integer,
  p_discount_label text,
  p_subtotal integer,
  p_discount_amount integer,
  p_shipping_fee integer,
  p_total integer,
  p_items jsonb
) returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_order_id uuid;
  v_item jsonb;
  v_product_id bigint;
  v_qty integer;
  v_color_name text;
  v_size text;
  v_color_id bigint;
  v_product_stock integer;
  v_color_stock integer;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Order items are required.';
  end if;

  insert into public.orders (
    order_number,
    customer_name,
    customer_phone,
    customer_email,
    province,
    district,
    ward,
    address,
    note,
    payment_method,
    voucher_code,
    discount_pct,
    discount_label,
    subtotal,
    discount_amount,
    shipping_fee,
    total,
    status
  )
  values (
    p_order_number,
    p_customer_name,
    p_customer_phone,
    p_customer_email,
    p_province,
    p_district,
    p_ward,
    p_address,
    p_note,
    p_payment_method,
    p_voucher_code,
    p_discount_pct,
    p_discount_label,
    p_subtotal,
    p_discount_amount,
    p_shipping_fee,
    p_total,
    'pending'
  )
  returning id into v_order_id;

  for v_item in
    select value
    from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item ->> 'productId')::bigint;
    v_qty := greatest(1, least(10, coalesce((v_item ->> 'qty')::integer, 1)));
    v_color_name := nullif(trim(v_item ->> 'colorName'), '');
    v_size := nullif(trim(v_item ->> 'size'), '');

    if v_product_id is null then
      raise exception 'Invalid product in order.';
    end if;

    if v_color_name is null then
      raise exception 'Invalid color for product %.', v_product_id;
    end if;

    if v_size is null then
      raise exception 'Invalid size for product %.', v_product_id;
    end if;

    select stock_count
    into v_product_stock
    from public.products
    where id = v_product_id
    for update;

    if not found then
      raise exception 'Product % does not exist.', v_product_id;
    end if;

    if v_product_stock < v_qty then
      raise exception 'Product % is out of stock.', v_product_id;
    end if;

    select id, stock_count
    into v_color_id, v_color_stock
    from public.product_colors
    where product_id = v_product_id
      and name = v_color_name
    for update;

    if not found then
      raise exception 'Invalid color for product %.', v_product_id;
    end if;

    if v_color_stock < v_qty then
      raise exception 'Selected color is out of stock for product %.', v_product_id;
    end if;

    perform 1
    from public.product_sizes
    where product_id = v_product_id
      and size = v_size
      and available = true
      and (color_id = v_color_id or color_id is null)
    limit 1;

    if not found then
      raise exception 'Invalid size for product %.', v_product_id;
    end if;

    update public.product_colors
    set stock_count = stock_count - v_qty
    where id = v_color_id;

    update public.products
    set stock_count = stock_count - v_qty
    where id = v_product_id;

    if v_color_stock - v_qty <= 0 then
      update public.product_sizes
      set available = false
      where product_id = v_product_id
        and color_id = v_color_id;
    end if;

    insert into public.order_items (
      order_id,
      product_id,
      product_name,
      product_href,
      variant_label,
      qty,
      unit_price,
      line_total,
      bg_class
    )
    values (
      v_order_id,
      v_product_id,
      coalesce(v_item ->> 'name', ''),
      coalesce(v_item ->> 'href', ''),
      coalesce(v_item ->> 'sub', ''),
      v_qty,
      coalesce((v_item ->> 'price')::integer, 0),
      coalesce((v_item ->> 'price')::integer, 0) * v_qty,
      coalesce(v_item ->> 'bgClass', '')
    );
  end loop;

  return v_order_id;
end;
$$;

create or replace function public.admin_upsert_product(
  p_product_id bigint,
  p_name text,
  p_subtitle text,
  p_category text,
  p_description text,
  p_price integer,
  p_old_price integer,
  p_tag text,
  p_tag_variant text,
  p_rating numeric,
  p_review_count integer,
  p_featured boolean,
  p_sort_order integer,
  p_specs jsonb,
  p_features jsonb,
  p_color_variants jsonb,
  p_general_images jsonb
) returns bigint
language plpgsql
set search_path = public
as $$
declare
  v_product_id bigint;
  v_total_stock_count integer := 0;
  v_variant jsonb;
  v_size text;
  v_spec jsonb;
  v_feature text;
  v_image jsonb;
  v_color_id bigint;
  v_color_name text;
  v_first_bg_class text := 'from-[#111111] to-[#222222]';
  v_bg_class text;
  v_assigned_color_name text;
  v_assigned_color_id bigint;
  v_size_position integer;
  v_spec_position integer := 0;
  v_feature_position integer := 0;
  v_image_position integer := 0;
begin
  if jsonb_typeof(p_color_variants) <> 'array' or jsonb_array_length(p_color_variants) = 0 then
    raise exception 'At least one color variant is required.';
  end if;

  select coalesce(sum(coalesce((value ->> 'stockCount')::integer, 0)), 0)
  into v_total_stock_count
  from jsonb_array_elements(p_color_variants);

  if p_product_id is null then
    insert into public.products (
      name,
      subtitle,
      category,
      description,
      price,
      old_price,
      tag,
      tag_variant,
      rating,
      review_count,
      stock_count,
      featured,
      sort_order
    )
    values (
      p_name,
      p_subtitle,
      p_category,
      p_description,
      p_price,
      p_old_price,
      p_tag,
      p_tag_variant,
      p_rating,
      p_review_count,
      v_total_stock_count,
      p_featured,
      p_sort_order
    )
    returning id into v_product_id;
  else
    v_product_id := p_product_id;

    update public.products
    set
      name = p_name,
      subtitle = p_subtitle,
      category = p_category,
      description = p_description,
      price = p_price,
      old_price = p_old_price,
      tag = p_tag,
      tag_variant = p_tag_variant,
      rating = p_rating,
      review_count = p_review_count,
      stock_count = v_total_stock_count,
      featured = p_featured,
      sort_order = p_sort_order
    where id = v_product_id;

    if not found then
      raise exception 'Product % does not exist.', v_product_id;
    end if;
  end if;

  delete from public.product_images where product_id = v_product_id;
  delete from public.product_sizes where product_id = v_product_id;
  delete from public.product_colors where product_id = v_product_id;
  delete from public.product_specs where product_id = v_product_id;
  delete from public.product_features where product_id = v_product_id;

  create temporary table tmp_product_color_map (
    color_name text primary key,
    color_id bigint not null,
    bg_class text not null
  ) on commit drop;

  for v_variant in
    select value
    from jsonb_array_elements(p_color_variants)
  loop
    v_color_name := v_variant ->> 'colorName';

    insert into public.product_colors (
      product_id,
      name,
      hex,
      bg_class,
      stock_count,
      position
    )
    values (
      v_product_id,
      v_color_name,
      coalesce(v_variant ->> 'hex', '#111111'),
      coalesce(v_variant ->> 'bgClass', 'from-[#111111] to-[#1f1f1f]'),
      coalesce((v_variant ->> 'stockCount')::integer, 0),
      coalesce((v_variant ->> 'position')::integer, 0)
    )
    returning id into v_color_id;

    insert into tmp_product_color_map (color_name, color_id, bg_class)
    values (
      v_color_name,
      v_color_id,
      coalesce(v_variant ->> 'bgClass', 'from-[#111111] to-[#1f1f1f]')
    );
  end loop;

  select bg_class
  into v_first_bg_class
  from tmp_product_color_map
  order by color_id
  limit 1;

  for v_variant in
    select value
    from jsonb_array_elements(p_color_variants)
  loop
    v_color_name := v_variant ->> 'colorName';

    select color_id
    into v_color_id
    from tmp_product_color_map
    where color_name = v_color_name;

    v_size_position := 0;

    for v_size in
      select value
      from jsonb_array_elements_text(coalesce(v_variant -> 'sizes', '[]'::jsonb))
    loop
      insert into public.product_sizes (
        product_id,
        color_id,
        size,
        available,
        position
      )
      values (
        v_product_id,
        v_color_id,
        v_size,
        true,
        v_size_position
      );

      v_size_position := v_size_position + 1;
    end loop;
  end loop;

  for v_spec in
    select value
    from jsonb_array_elements(coalesce(p_specs, '[]'::jsonb))
  loop
    insert into public.product_specs (
      product_id,
      label,
      value,
      position
    )
    values (
      v_product_id,
      coalesce(v_spec ->> 'label', ''),
      coalesce(v_spec ->> 'value', ''),
      v_spec_position
    );

    v_spec_position := v_spec_position + 1;
  end loop;

  for v_feature in
    select value #>> '{}'
    from jsonb_array_elements(coalesce(p_features, '[]'::jsonb))
  loop
    insert into public.product_features (
      product_id,
      value,
      position
    )
    values (
      v_product_id,
      coalesce(v_feature, ''),
      v_feature_position
    );

    v_feature_position := v_feature_position + 1;
  end loop;

  for v_image in
    select value
    from jsonb_array_elements(coalesce(p_general_images, '[]'::jsonb))
  loop
    v_assigned_color_name := nullif(trim(v_image ->> 'assignedColorName'), '');

    if v_assigned_color_name is not null then
      select color_id, bg_class
      into v_assigned_color_id, v_bg_class
      from tmp_product_color_map
      where color_name = v_assigned_color_name;
    else
      v_assigned_color_id := null;
      v_bg_class := v_first_bg_class;
    end if;

    insert into public.product_images (
      product_id,
      color_id,
      alt,
      bg_class,
      icon_path,
      image_url,
      position
    )
    values (
      v_product_id,
      v_assigned_color_id,
      case
        when v_assigned_color_name is null then 'Product image ' || (v_image_position + 1)
        else v_assigned_color_name || ' image ' || (v_image_position + 1)
      end,
      coalesce(v_bg_class, v_first_bg_class),
      case
        when p_category = 'Hoodie' then 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10'
        when p_category = 'Pants' then 'M5 2h14l-2 20h-4l-1-10-1 10H7L5 2z'
        else 'M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z'
      end,
      coalesce(v_image ->> 'url', ''),
      v_image_position
    );

    v_image_position := v_image_position + 1;
  end loop;

  for v_variant in
    select value
    from jsonb_array_elements(p_color_variants)
  loop
    v_color_name := v_variant ->> 'colorName';

    for v_image in
      select value
      from jsonb_array_elements(coalesce(v_variant -> 'images', '[]'::jsonb))
    loop
      v_assigned_color_name := coalesce(
        nullif(trim(v_image ->> 'assignedColorName'), ''),
        v_color_name
      );

      select color_id, bg_class
      into v_assigned_color_id, v_bg_class
      from tmp_product_color_map
      where color_name = v_assigned_color_name;

      insert into public.product_images (
        product_id,
        color_id,
        alt,
        bg_class,
        icon_path,
        image_url,
        position
      )
      values (
        v_product_id,
        v_assigned_color_id,
        v_assigned_color_name || ' image ' || (v_image_position + 1),
        coalesce(v_bg_class, v_first_bg_class),
        case
          when p_category = 'Hoodie' then 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10'
          when p_category = 'Pants' then 'M5 2h14l-2 20h-4l-1-10-1 10H7L5 2z'
          else 'M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z'
        end,
        coalesce(v_image ->> 'url', ''),
        v_image_position
      );

      v_image_position := v_image_position + 1;
    end loop;
  end loop;

  return v_product_id;
end;
$$;
