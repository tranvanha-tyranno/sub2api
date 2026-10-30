# Chạy bản Docker đã build sẵn

## Tự động build trên GitHub (khuyến nghị)

Workflow **Build Docker Web** (`.github/workflows/docker-web.yml`) build cả
frontend Vue và backend Go vào cùng một image cho `linux/amd64` và `linux/arm64`.
Workflow chạy khi push thay đổi ứng dụng lên `main`, hoặc chạy thủ công ở
GitHub → Actions → Build Docker Web → Run workflow. Pull request chỉ kiểm tra
build, không xuất bản image.

Sau khi workflow thành công, image có tại:

```text
ghcr.io/tranvanha-tyranno/sub2api:main
ghcr.io/tranvanha-tyranno/sub2api:sha-<40 ký tự commit SHA>
```

Tag `main` theo bản build mới nhất của nhánh main; tag `sha-...` dùng để chọn
chính xác một commit hoặc quay lại bản cũ. Workflow Release hiện có vẫn quản
lý riêng các tag phiên bản và `latest`.

Workflow dùng `GITHUB_TOKEN` có sẵn, quyền `packages: write`, không cần secret
Docker Hub. Với fork, bật Actions nếu GitHub chưa cho phép workflow chạy.
Nếu publish báo lỗi quyền package đã tồn tại, vào package Settings → Manage
Actions access và cấp quyền Write cho repository này.

### Server đang chạy sẵn

Vào đúng thư mục deploy đang chứa `.env` và file Compose của hệ thống hiện tại.
Cập nhật file Compose tương ứng từ repo này, giữ nguyên `.env`, dữ liệu và
project name (`-p`) / `--env-file` đang dùng. Ba file production
`docker-compose.yml`, `docker-compose.local.yml`, `docker-compose.standalone.yml`
đã trỏ đến image GHCR của fork, không có bước build.

Thêm hoặc sửa đúng một dòng trong `.env`:

```dotenv
SUB2API_IMAGE=ghcr.io/tranvanha-tyranno/sub2api:main
```

Đợi workflow thành công rồi chạy (thay tên file nếu đang dùng bản khác):

```sh
docker compose -f docker-compose.local.yml pull sub2api
docker compose -f docker-compose.local.yml up -d --no-build sub2api
docker compose -f docker-compose.local.yml ps
docker compose -f docker-compose.local.yml logs --tail=80 sub2api
```

Nếu chỉ muốn thay image trong file Compose tùy chỉnh đang có, đổi trường
`services.sub2api.image` thành `${SUB2API_IMAGE:-ghcr.io/tranvanha-tyranno/sub2api:main}`
rồi cũng dùng các lệnh trên. Không dùng `docker-compose.dev.yml` khi triển khai
image có sẵn vì file đó dành cho build từ source.

Nếu GHCR package đang private, đăng nhập trên server bằng GitHub username và
PAT có quyền `read:packages` (nhập PAT ở lời nhắc password):

```sh
docker login ghcr.io -u tranvanha-tyranno
```

Hoặc chuyển package sang Public trong GitHub → Packages → sub2api → Package
settings → Change visibility để server pull không cần đăng nhập.

Triển khai mới: tải repo của fork, vào `deploy/`, sao chép `.env.example` thành
`.env`, cấu hình mật khẩu PostgreSQL/JWT/TOTP và tài khoản admin như hướng dẫn
trong README, rồi chạy `docker compose -f docker-compose.local.yml up -d --no-build`.

## Cách thay thế: build tại máy phát triển và chuyển archive

Quy trình này dành cho VPS Linux x86_64/amd64 đang chạy Sub2API bằng Docker
Compose. Build image trên máy phát triển, tải image lên GitHub Releases, rồi
tải image về VPS. VPS không cần cài Node.js hoặc Go và không chạy lại bước build.

## Build trên máy phát triển

Từ thư mục gốc của repository:

```sh
docker build --platform linux/amd64 \
  --build-arg FRONTEND_NODE_OPTIONS=--max-old-space-size=4096 \
  --build-arg COMMIT="$(git rev-parse --short=12 HEAD)" \
  -t sub2api:server-build .
docker save -o sub2api-linux-amd64.tar sub2api:server-build
gzip sub2api-linux-amd64.tar
sha256sum sub2api-linux-amd64.tar.gz > SHA256SUMS
```

Cả hai Dockerfile (`Dockerfile` và `deploy/Dockerfile`) nhận build argument
`FRONTEND_NODE_OPTIONS`. Mặc định heap Node.js là 4096 MiB, chỉ áp dụng trong
stage build frontend. Máy build cần thêm bộ nhớ cho các tiến trình khác.

Đưa archive, `SHA256SUMS` và file override bên dưới lên GitHub Release. Dùng
Release assets cho file image; không commit archive vào lịch sử Git.

## Chạy trên VPS đã có cấu hình

1. Vào đúng thư mục đang chứa file Compose và `.env` của hệ thống hiện tại.
2. Kiểm tra `uname -m`: image amd64 cần máy `x86_64`.
3. Tải archive và `SHA256SUMS` từ cùng một release, rồi chạy:

```sh
sha256sum -c SHA256SUMS
docker load -i sub2api-linux-amd64.tar.gz
```

Tạo `docker-compose.prebuilt.yml`, dùng đúng tag đã được nạp từ archive:

```yaml
services:
  sub2api:
    image: sub2api:server-build
    pull_policy: never
    platform: linux/amd64
```

Trong các lệnh dưới đây, thay `docker-compose.local.yml` bằng file Compose
đang thực sự dùng. Giữ nguyên project name (`-p`) và `--env-file` nếu lần chạy
trước có dùng các tùy chọn này.

```sh
docker compose -f docker-compose.local.yml -f docker-compose.prebuilt.yml \
  up -d --no-build sub2api
docker compose -f docker-compose.local.yml -f docker-compose.prebuilt.yml ps
docker compose -f docker-compose.local.yml -f docker-compose.prebuilt.yml \
  logs --tail=80 sub2api
```

`--no-build` bỏ qua cấu hình `build:` nếu file Compose gốc có mục này.
`pull_policy: never` dùng image đã nạp cho service `sub2api`. PostgreSQL và Redis
vẫn dùng cấu hình trong file Compose gốc; Docker có thể tải image của hai dịch
vụ đó nếu chưa có trên VPS.

Giữ nguyên `.env`, các volume và thư mục dữ liệu của bản triển khai đang chạy.
Những lần khởi động hoặc cập nhật sau cũng cần truyền cả hai file Compose.
Nếu chạy lại chỉ với file gốc, service có thể dùng lại image cũ.

## Kiểm tra bản build trước khi phát hành

- `docker image inspect` xác nhận `linux/amd64`.
- Chạy image với `--version` để kiểm tra binary.
- Kiểm tra image chứa `/app/resources` và công cụ backup PostgreSQL.
- Chạy container thử với database/Redis riêng, kiểm tra `/health` và trang chủ.
- Tạo checksum sau khi hoàn tất archive.

Image phát hành chỉ chứa ứng dụng, frontend và tài nguyên đi kèm. Không đưa
`.env`, API key, database hoặc volume dữ liệu lên GitHub.
