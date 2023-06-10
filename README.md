#CRAWLING F1 RESULT

- Đầu tiên sử dụng thư viện [**cheerio**](https://cheerio.js.org/) lấy tất cả các năm từ https://www.formula1.com/en/results.html bỏ vào 1 mảng `years`.
- Lấy dữ liệu **races** bằng cách lặp qua mảng `years` và cào dữ liệu từ url: https://www.formula1.com/en/results/jcr:content/resultsarchive.html/{year}/races.html. Sử dụng `Promise.all()` để tối ưu tốc độ.
  - Lấy kết quả tổng quan bằng chính kết quả trả về trong url bên trên.
  - Lấy kết quả chi tiết từng chặng grand prix bằng url gắn trong tên từng chặng.
