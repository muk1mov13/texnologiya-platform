import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { t } from './i18n'

// start-backend.mjs dagi ADMIN_EMAIL / ADMIN_PASSWORD bilan bir xil.
const ADMIN = { email: 'admin@e2e.uz', password: 'e2e-admin-parol-123' }
const SAMPLE_PDF = fileURLToPath(new URL('./.data/sample.pdf', import.meta.url))

async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel(t('auth.email')).fill(email)
  await page.getByLabel(t('auth.password'), { exact: true }).fill(password)
  await page.getByRole('button', { name: t('auth.login.submit') }).click()
}

test("ro'yxatdan o'tish → admin tasdig'i → bosqichni tugatish → progress", async ({ browser, page }) => {
  const stamp = Date.now()
  const subjectTitle = `E2E fani ${stamp}`
  const student = { name: 'E2E Talaba', email: `talaba${stamp}@e2e.uz`, password: 'talaba-parol-123' }

  // 1. Admin kontent tayyorlaydi: fan, mavzu, PDF, nashr.
  const adminContext = await browser.newContext()
  const admin = await adminContext.newPage()
  await login(admin, ADMIN.email, ADMIN.password)
  await expect(admin).toHaveURL(/\/admin\/users$/)

  await admin.goto('/admin/subjects')
  await admin.getByRole('button', { name: t('admin.subjects.new') }).click()
  const dialog = admin.getByRole('dialog')
  await dialog.getByLabel(t('admin.subjects.titleLabel')).fill(subjectTitle)
  await dialog.getByLabel(t('admin.subjects.publishedLabel')).check()
  await dialog.getByRole('button', { name: t('common.save') }).click()
  await expect(admin.getByRole('listitem', { name: subjectTitle })).toBeVisible()

  await admin.goto('/teach')
  await admin.getByLabel(t('teach.newTopicLabel')).fill('Kasb tanlash asoslari')
  await admin.getByRole('button', { name: t('teach.addTopic') }).click()
  await expect(admin).toHaveURL(/\/teach\/topics\/\d+$/)

  await admin.getByLabel(t('teach.materialTitle')).fill("Kirish ma'ruzasi")
  await admin.getByLabel(t('teach.materialFile')).setInputFiles(SAMPLE_PDF)
  await admin.getByRole('button', { name: t('teach.upload') }).click()
  await expect(admin.getByRole('listitem', { name: "Kirish ma'ruzasi" })).toContainText(t('teach.status.ready'))

  await admin.getByLabel(t('teach.topicPublished')).check()
  await admin.getByRole('button', { name: t('common.save') }).click()
  await expect(admin.getByText(t('teach.topicSaved'))).toBeVisible()

  // 2. Talaba ro'yxatdan o'tadi va tasdiq kutadi.
  await page.goto('/register')
  await page.getByLabel(t('auth.fullName')).fill(student.name)
  await page.getByLabel(t('auth.email')).fill(student.email)
  await page.getByLabel(t('auth.password'), { exact: true }).fill(student.password)
  await page.getByLabel(t('auth.passwordConfirm')).fill(student.password)
  await page.getByRole('button', { name: t('auth.register.submit') }).click()
  await expect(page).toHaveURL(/\/pending$/)

  // 3. Admin tasdiqlaydi.
  await admin.goto('/admin/users')
  const row = admin.getByRole('listitem', { name: student.name })
  await row.getByRole('button', { name: t('admin.users.approve') }).click()
  await expect(row).toBeHidden()
  await adminContext.close()

  // 4. Talaba kiradi, mavzuni ochadi va bosqichni tugatadi.
  await login(page, student.email, student.password)
  await expect(page).toHaveURL(/\/app$/)
  await page
    .getByRole('link', { name: new RegExp(subjectTitle) })
    .filter({ hasText: t('student.topicCount', { count: 1 }) })
    .click()
  await page.getByRole('link', { name: /Kasb tanlash asoslari/ }).click()
  await expect(page).toHaveURL(/\/app\/topics\/\d+\/lecture$/)
  await expect(page.locator('.react-pdf__Page__canvas')).toBeVisible()

  await page.getByRole('button', { name: t('player.complete') }).click()
  await expect(page.getByText(t('player.completedToast'))).toBeVisible()

  // 5. Progress yangilangan.
  await page.goto('/app')
  await expect(page.getByRole('img', { name: t('common.progress', { completed: 1, total: 1 }) })).toBeVisible()
})
