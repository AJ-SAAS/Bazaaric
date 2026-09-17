import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/auth",
        destination: "/register",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);