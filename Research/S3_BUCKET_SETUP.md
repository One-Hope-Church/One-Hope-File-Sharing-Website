# S3 bucket setup – One Hope Resources

This guide walks you through creating the S3 bucket and IAM user so the app can upload (admins) and serve downloads (presigned URLs). Nothing in the bucket is public; all access is via presigned URLs.

---

## 1. Sign in to AWS

1. Go to [https://console.aws.amazon.com](https://console.aws.amazon.com).
2. Sign in with your AWS account (root or an IAM user with admin access).
3. In the search bar at the top, type **S3** and open **S3** (or go to **Services → Storage → S3**).

---

## 2. Create the bucket

1. Click **Create bucket**.
2. **Bucket name**
   - Enter: `onehope-resources-prod` (or another globally unique name; you’ll use this in `S3_BUCKET_RESOURCES` in `.env`).
   - Bucket names must be unique across all of AWS and follow [naming rules](https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucketnamingrules.html) (lowercase, numbers, hyphens).
3. **AWS Region**
   - Choose a region (e.g. **US East (N. Virginia)** `us-east-1`).
   - Note it for `AWS_REGION` in `.env`.
4. **Object Ownership**
   - Leave **ACLs disabled (recommended)**.
   - Ownership: **Bucket owner enforced**.
5. **Block Public Access**
   - **Keep all four options checked** (Block all public access).
   - We do not expose objects publicly; the app uses presigned URLs only.
6. **Bucket Versioning**
   - Optional; **Disable** is fine to start.
7. **Default encryption**
   - **Enable** (SSE-S3) is recommended.
8. **Advanced**
   - Leave defaults (no Object Lock).
9. Click **Create bucket**.

---

## 3. Add CORS (for browser uploads)

The app uploads files from the browser using presigned PUT URLs. The bucket must allow your app’s origin and the `PUT` method.

1. In S3, click the bucket you just created (`onehope-resources-prod`).
2. Open the **Permissions** tab.
3. Scroll to **Cross-origin resource sharing (CORS)** and click **Edit**.
4. Paste the following (replace `https://your-app-domain.com` with your real app URL and add `http://localhost:3000` for local dev):

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-app-domain.com"
    ],
    "ExposeHeaders": ["ETag"]
  }
]
```

- **AllowedMethods:** `PUT` for upload; `GET` and `HEAD` for presigned downloads if the browser hits the bucket directly.
- **AllowedOrigins:** Your Next.js app origin(s). Add your production URL when you have it.
5. Click **Save changes**.

---

## 4. Create an IAM user for the app

The app needs AWS credentials (access key) with permission to generate presigned URLs and to put/get objects. Use a dedicated IAM user (not the root account).

1. In the AWS search bar, type **IAM** and open **IAM**.
2. In the left sidebar, click **Users** → **Create user**.
3. **User name:** e.g. `onehope-resources-app`.
4. **Provide user access to the AWS Management Console:** optional (you can leave unchecked if this user is only for API access).
5. Click **Next**.
6. **Set permissions**
   - Choose **Attach policies directly**.
   - Click **Create policy** (opens a new tab). You’ll create a custom policy that allows only this bucket:
     - **Service:** S3.
     - **Actions:** Under “Write” select **PutObject**; under “Read” select **GetObject**. Optionally add **ListBucket** if you ever need to list objects.
     - **Resources:**
       - Bucket: add the bucket ARN, e.g. `arn:aws:s3:::onehope-resources-prod`.
       - Object: add `arn:aws:s3:::onehope-resources-prod/*`.
     - Or use this policy (replace `onehope-resources-prod` with your bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::onehope-resources-prod/*"
    },
    {
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::onehope-resources-prod"
    }
  ]
}
```

   - Name the policy e.g. `OneHopeResourcesS3Access` → **Create policy**.
   - Back in the **Create user** tab, refresh the policy list, then attach **OneHopeResourcesS3Access** to the user.
7. Click **Next** → **Create user**.

---

## 5. Create access keys for the IAM user

1. Click the user you just created (`onehope-resources-app`).
2. Open the **Security credentials** tab.
3. Under **Access keys**, click **Create access key**.
4. **Use case:** e.g. **Application running outside AWS** (or “Other”).
5. Click **Next** → **Create access key**.
6. **Copy the Access key ID and Secret access key** and store them somewhere safe (you won’t see the secret again). You’ll put them in `web/.env`:
   - `AWS_ACCESS_KEY_ID=<Access key ID>`
   - `AWS_SECRET_ACCESS_KEY=<Secret access key>`
7. Click **Done**.

---

## 6. Set environment variables

In **`web/.env`** (and in production later), set:

```env
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
S3_BUCKET_RESOURCES=onehope-resources-prod
```

- Use the **region** where you created the bucket (e.g. `us-east-1`).
- Use the **bucket name** you chose in step 2.

Restart the Next.js dev server after changing `.env`.

---

## 7. Quick check

- **Upload:** As an admin, use the app’s upload flow; it should call the presign API and upload to S3. Check the bucket in the S3 console for new objects under `collections/...`.
- **Download:** Open a resource that has an `s3Key`; the app should generate a presigned GET URL and redirect or open it.

If you hit “Upload not configured” or download errors, confirm the four env vars are set and the IAM policy allows `s3:PutObject` and `s3:GetObject` on your bucket.

---

## Summary

| Step | What you did |
|------|----------------|
| 1 | Signed in to AWS |
| 2 | Created bucket (e.g. `onehope-resources-prod`), block all public access, optional encryption |
| 3 | Set CORS on the bucket for your app origin(s) and `PUT`/`GET`/`HEAD` |
| 4 | Created IAM user and custom policy (PutObject, GetObject, optional ListBucket on that bucket) |
| 5 | Created access key, saved ID and secret |
| 6 | Set `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET_RESOURCES` in `web/.env` |

After this, the next step in your plan is **Step 4 – Production** (deploy app, set production env vars, point domain).
