import os
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE_URL = os.getenv("SHOWCASE_BASE_URL", "https://localhost:5173")
OUT_DIR = Path("knowledge_base/pages")
TIMEOUT_MS = int(os.getenv("SHOWCASE_TIMEOUT_MS", "45000"))

# Pre-login showcase routes from frontend/src/showcase/ShowcaseApp.jsx
PAGES = [
    ("/", "landing_home"),
    ("/product/overview", "product_overview"),
    ("/product/attendance-tracking", "product_attendance_tracking"),
    ("/product/leave-management", "product_leave_management"),
    ("/product/workforce-analytics", "product_workforce_analytics"),
    ("/product/policy-geofencing", "product_policy_geofencing"),
    ("/product/reports-automation", "product_reports_automation"),
    ("/solutions/hr-teams", "solutions_hr_teams"),
    ("/solutions/managers", "solutions_managers"),
    ("/solutions/enterprises", "solutions_enterprises"),
    ("/solutions/remote-teams", "solutions_remote_teams"),
    ("/features/smart-attendance", "features_smart_attendance"),
    ("/features/face-camera-verification", "features_face_camera_verification"),
    ("/features/geofencing-location-tracking", "features_geofencing_location_tracking"),
    ("/features/correction-approval-workflows", "features_correction_approval_workflows"),
    ("/features/daily-activity-reports", "features_daily_activity_reports"),
    ("/features/employee-management", "features_employee_management"),
    ("/features/payroll-ready-reports", "features_payroll_ready_reports"),
    ("/features/real-time-notifications", "features_real_time_notifications"),
    ("/resources/documentation", "resources_documentation"),
    ("/resources/blog", "resources_blog"),
    ("/resources/faqs", "resources_faqs"),
    ("/company/about", "company_about"),
    ("/company/contact", "company_contact"),
    ("/pricing", "pricing"),
    ("/security", "security"),
]


def clean_text(value: str) -> str:
    text = re.sub(r"\r\n?", "\n", value or "")
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def scroll_page(page) -> None:
    page.evaluate(
        r"""
        async () => {
            await new Promise((resolve) => {
                let totalHeight = 0;
                const distance = 600;
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;
                    if (totalHeight >= scrollHeight) {
                        clearInterval(timer);
                        window.scrollTo(0, 0);
                        resolve();
                    }
                }, 120);
            });
        }
        """
    )


def extract_sections(page):
    return page.evaluate(
        r"""
        () => {
            const removeNoise = ['script', 'style', 'noscript', 'svg', 'iframe'];
            removeNoise.forEach((sel) => {
                document.querySelectorAll(sel).forEach((n) => n.remove());
            });

            const blocks = [];
            const sectionNodes = Array.from(document.querySelectorAll('main section, section, article'));
            const footerNodes = Array.from(document.querySelectorAll('footer, [role="contentinfo"], .footer, #footer'));

            const readText = (node) => (node?.innerText || '')
                .replace(/\u00a0/g, ' ')
                .replace(/\n{3,}/g, '\n\n')
                .trim();

            const readHeading = (node) => {
                const h = node.querySelector('h1, h2, h3');
                return h ? h.innerText.trim() : '';
            };

            const unique = new Set();
            for (const node of sectionNodes) {
                const text = readText(node);
                if (!text || text.length < 30) continue;
                if (unique.has(text)) continue;
                unique.add(text);
                blocks.push({
                    heading: readHeading(node),
                    text,
                });
            }

            // Include footer/contact text even when sections exist, because office/location
            // details are often placed at the end of marketing pages.
            for (const node of footerNodes) {
                const text = readText(node);
                if (!text || text.length < 30) continue;
                if (unique.has(text)) continue;
                unique.add(text);
                blocks.push({
                    heading: 'Footer & Contact Details',
                    text,
                });
            }

            if (blocks.length === 0) {
                const body = readText(document.body || document.documentElement);
                if (body) {
                    blocks.push({ heading: 'Page Content', text: body });
                }
            }

            return {
                title: (document.title || '').trim(),
                blocks,
            };
        }
        """
    )


def write_page_file(slug: str, url: str, title: str, blocks) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / f"{slug}.txt"

    lines = [
        f"PAGE: {title or slug.replace('_', ' ').upper()}",
        f"URL: {url}",
        "",
    ]

    for idx, block in enumerate(blocks, start=1):
        heading = block.get("heading") or f"SECTION {idx}"
        text = clean_text(block.get("text", ""))
        if not text:
            continue

        lines.extend([
            "=" * 60,
            f"[ SECTION {idx}: {heading} ]",
            "=" * 60,
            text,
            "",
        ])

    out_path.write_text("\n".join(lines).strip() + "\n", encoding="utf-8")


def main() -> None:
    print(f"[SCRAPER] Base URL: {BASE_URL}")
    print(f"[SCRAPER] Output dir: {OUT_DIR}")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(ignore_https_errors=True)

        success = 0
        for route, slug in PAGES:
            url = f"{BASE_URL.rstrip('/')}{route}"
            print(f"[SCRAPER] Fetching: {url}")

            saved = False
            for attempt in range(2):
                page = context.new_page()
                try:
                    page.goto(url, wait_until="networkidle", timeout=TIMEOUT_MS)
                    page.wait_for_timeout(700)
                    scroll_page(page)
                    data = extract_sections(page)
                    write_page_file(slug, url, data.get("title", ""), data.get("blocks", []))
                    print(f"[SCRAPER] Saved: {slug}.txt")
                    success += 1
                    saved = True
                    break
                except Exception as err:
                    if attempt == 0:
                        print(f"[SCRAPER] Retry: {url} -> {err}")
                    else:
                        print(f"[SCRAPER] Failed: {url} -> {err}")
                finally:
                    page.close()

            if not saved:
                continue

        browser.close()

    print(f"[SCRAPER] Completed: {success}/{len(PAGES)} pages")


if __name__ == "__main__":
    main()
