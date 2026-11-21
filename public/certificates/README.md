# Certificate thumbnails

Drop certificate images here, then set the matching `thumb` field in
`src/data/portfolio.ts` to the public path, for example:

```ts
{
  date: 'May 18, 2026',
  title: 'Service Awardee',
  detail: 'Pasidungog 2026, CPSU',
  thumb: '/certificates/service-awardee-2026.jpg',
}
```

Recommended size is about 400×280 (4:3). Images are only rendered when a
`thumb` is set, so nothing 404s while the folder is empty.
