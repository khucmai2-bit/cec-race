# CEC RACE — website thi đua doanh thu 12 cơ sở

## Kiến trúc
- Frontend: React + Vite.
- Backend/DB: Supabase Postgres + Edge Functions.
- Mỗi cơ sở có PIN riêng; admin có PIN riêng.
- Mọi thao tác đọc/ghi đi qua Edge Functions bằng service role key ở phía server.
- Bảng đua tự đồng bộ bằng cách gọi API mỗi 2,5 giây (near-live polling). Không phải WebSocket push.
- Dữ liệu được tách theo tháng `YYYY-MM`; tháng mới tự tạo kỳ mới, dữ liệu tháng cũ vẫn được giữ.

## 1. Tạo Supabase project
Tạo project tại https://supabase.com, lấy Project URL và anon key trong Project Settings → API.

## 2. Cài schema
Chạy lần lượt trong Supabase SQL Editor:
1. `supabase/migrations/001_init.sql`
2. `supabase/migrations/002_pin_function.sql`

## 3. Tạo PIN ban đầu
Tạo hash bcrypt cho PIN bằng SQL trong Supabase SQL Editor. Ví dụ dưới đây tạo PIN tạm `2468` cho tất cả cơ sở và PIN admin tạm `8642`. **Thay ngay bằng PIN riêng, không dùng PIN mẫu trong môi trường thật.**
```sql
insert into public.branch_credentials(branch_id,pin_hash)
select id, crypt('2468', gen_salt('bf',10)) from public.branches
on conflict(branch_id) do update set pin_hash=excluded.pin_hash;

insert into public.admin_credentials(id,pin_hash)
values(1,crypt('8642',gen_salt('bf',10)))
on conflict(id) do update set pin_hash=excluded.pin_hash;
```
Để đặt PIN riêng từng cơ sở, chạy từng lệnh:
```sql
update public.branch_credentials
set pin_hash=crypt('PIN_MOI',gen_salt('bf',10))
where branch_id='HN2.VQ1';
```
Không gửi PIN qua nhóm chung. Nên dùng PIN dài tối thiểu 6 chữ số và đổi định kỳ.

## 4. Cấu hình Edge Functions
Cài Supabase CLI, đăng nhập và liên kết project:
```bash
npm install
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase secrets set SUPABASE_URL=https://YOUR_PROJECT.supabase.co SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
npx supabase functions deploy login
npx supabase functions deploy board
npx supabase functions deploy submit-revenue
npx supabase functions deploy set-target
```
`SUPABASE_SERVICE_ROLE_KEY` chỉ đặt trong Supabase secrets. Tuyệt đối không đưa vào `.env` của frontend, GitHub hay trình duyệt.

## 5. Chạy frontend
```bash
cp .env.example .env
# Điền VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```
Đưa lên Vercel hoặc Netlify bằng lệnh build `npm run build`, thư mục output `dist`. Thêm hai biến `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` vào hosting.

## 6. Phân quyền
- Quản lý cơ sở đăng nhập bằng PIN của cơ sở đã chọn.
- PIN cơ sở chỉ tạo session gắn với đúng branch_id; API submit không nhận branch_id từ trình duyệt nên không thể tự đổi cơ sở.
- Admin dùng PIN riêng, được đặt KPI.
- Bảng dữ liệu không cấp quyền đọc/ghi trực tiếp cho anon/authenticated; Edge Functions dùng service role để thực hiện sau khi kiểm tra session.
- Session hết hạn sau 12 giờ.

## 7. Vận hành theo tháng
KPI và doanh thu được lưu theo tháng Việt Nam. Khi sang tháng mới, hệ thống tạo kỳ mới tự nhiên; số liệu kỳ cũ không bị xóa. Admin cần thiết lập KPI cho 12 cơ sở vào đầu tháng.

## Trước khi dùng thật
- Thay tất cả PIN mẫu bằng PIN riêng.
- Bật giới hạn tần suất đăng nhập ở gateway/WAF hoặc bổ sung rate limit và khóa tạm khi nhập sai nhiều lần.
- Cấu hình domain riêng, HTTPS, backup database và người chịu trách nhiệm quản trị.
- Đây là bản MVP: bảng đua cập nhật mỗi 2,5 giây, không phải realtime WebSocket; giao diện hiện chưa có chức năng reset dữ liệu hoặc xuất Excel.
