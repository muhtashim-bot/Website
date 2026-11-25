/*
 * Background footage for the homepage story, one clip per scene. The video follows the farmer's
 * season (ploughing, planting, growing, market, sunset); the phone and text show the service.
 *
 * Clips are real footage from Bangladesh on Pexels (free to use, no attribution required; credits
 * kept here and in the README). They are streamed from Pexels: each clip lists smaller renditions
 * first and the known original last, so the browser plays the lightest file that exists.
 *
 * To use your own footage, put an MP4 in /public/video/<scene>.mp4 and set `local` below; it is
 * then served with the site and tried first.
 */
export type Clip = {
  key: string; // one <video> element per key; scenes can share a clip at different start times
  poster: string;
  desktop: string[];
  mobile: string[];
  credit: string;
  page: string;
};

const file = (id: string, name: string) => `https://videos.pexels.com/video-files/${id}/${name}`;
const poster = (id: string, slug: string) => `https://images.pexels.com/videos/${id}/${slug}.jpeg?auto=compress&cs=tinysrgb&w=1600`;
// Newer Pexels uploads name their renditions predictably: <id>-hd_1280_720_30fps.mp4 and so on
const ladder = (id: string, fps: number[], original: string) => ({
  desktop: [...fps.map((f) => file(id, `${id}-hd_1280_720_${f}fps.mp4`)), file(id, original)],
  mobile: [...fps.flatMap((f) => [file(id, `${id}-sd_960_540_${f}fps.mp4`), file(id, `${id}-sd_640_360_${f}fps.mp4`)]), ...fps.map((f) => file(id, `${id}-hd_1280_720_${f}fps.mp4`)), file(id, original)],
});

export const clips: Record<string, Clip> = {
  aerial: {
    key: 'aerial',
    poster: poster('14416222', 'bangladesh-bd-farmer-farmer-farmers-14416222'),
    ...ladder('14416222', [60, 30], '14416222-hd_1920_1080_60fps.mp4'),
    credit: 'Aerial view of a farmer in a green rice field, Bangladesh',
    page: 'https://www.pexels.com/video/bangladeshi-farmer-working-in-field-14416222/',
  },
  plough: {
    key: 'plough',
    poster: poster('16629080', 'asian-asian-beauty-asian-farmer-bangladesh-16629080'),
    ...ladder('16629080', [24], '16629080-hd_1920_1080_24fps.mp4'),
    credit: 'A farmer ploughing with oxen, Bangladesh. Shariful Islam Palash',
    page: 'https://www.pexels.com/video/the-farmer-cultivating-his-land-in-bangladesh-16629080/',
  },
  planting: {
    key: 'planting',
    poster: poster('13020377', 'pexels-photo-13020377'),
    ...ladder('13020377', [30], '13020377-hd_1920_1080_30fps.mp4'),
    credit: 'Farmers working in wet rice fields, Sylhet. Nothing Ahead',
    page: 'https://www.pexels.com/video/people-working-on-rice-field-13020377/',
  },
  market: {
    key: 'market',
    poster: poster('34402895', 'agriculture-market-bangladesh-market-food-market-vegetable-market-34402895'),
    desktop: [file('34402895', '14574613_1920_1080_30fps.mp4')],
    mobile: [file('34402895', '14574613_1920_1080_30fps.mp4')],
    credit: 'A vegetable market in Bangladesh. Sky Bangla',
    page: 'https://www.pexels.com/video/vibrant-vegetable-market-in-bangladesh-34402895/',
  },
  sunset: {
    key: 'sunset',
    poster: poster('36099191', 'agriculture-asia-bangladesh-countryside-36099191'),
    desktop: [file('36099191', '15309084_1920_1080_30fps.mp4')],
    mobile: [file('36099191', '15309084_1920_1080_30fps.mp4')],
    credit: 'Farmers in the rice fields at sunset, Bangladesh. Sagor Mondol',
    page: 'https://www.pexels.com/video/farmers-tilling-rice-fields-at-sunset-in-bangladesh-36099191/',
  },
};

/** What plays behind each scene. `photo` is used instead of a clip where we have a real photo that fits better. */
export const sceneMedia: Record<string, { clip?: string; start?: number; photo?: string }> = {
  intro: { clip: 'aerial', start: 0 },
  finance: { clip: 'plough', start: 2 },
  inputs: { clip: 'planting', start: 4 },
  grow: { clip: 'aerial', start: 11 },
  market: { clip: 'market', start: 0 },
  center: { photo: '/photos/ifarmer-center-front-1920.jpg' },
  paid: { clip: 'sunset', start: 0 },
  outro: { clip: 'aerial', start: 16 },
};
