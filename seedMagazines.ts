import { prisma } from "./src/prisma/index.ts";

const magazines = [
	{
		date: "2025-03-01T00:00:00.000Z",
		link: "https://canva.link/4sqnyi6oghqa5re",
	},
	{
		date: "2025-04-01T00:00:00.000Z",
		link: "https://canva.link/ct65yaksocr3gxc",
	},
	{
		date: "2025-05-01T00:00:00.000Z",
		link: "https://canva.link/z7l45ncmir2pf0q",
	},
	{
		date: "2025-06-01T00:00:00.000Z",
		link: "https://canva.link/kqti1qwh1obls4d",
	},
	{
		date: "2025-09-01T00:00:00.000Z",
		link: "https://canva.link/fw8t26jhat4wc8j",
	},
	{
		date: "2025-10-01T00:00:00.000Z",
		link: "https://canva.link/028c00qwb27wjhn",
	},
	{
		date: "2025-11-01T00:00:00.000Z",
		link: "https://canva.link/h1zgla572dnfgp7",
	},
	{
		date: "2025-12-01T00:00:00.000Z",
		link: "https://canva.link/m8escywho6a6rb8",
	},
	{
		date: "2026-01-01T00:00:00.000Z",
		link: "https://canva.link/o5n26evuysnrew7",
	},
	{
		date: "2026-02-01T00:00:00.000Z",
		link: "https://canva.link/ltd600uorp0w65j",
	},
	{
		date: "2026-03-01T00:00:00.000Z",
		link: "https://canva.link/kz5s6r7nhbvwv6o",
	},
	{
		date: "2026-04-01T00:00:00.000Z",
		link: "https://canva.link/5zklv99zqm2wb9b",
	},
	{
		date: "2026-05-01T00:00:00.000Z",
		link: "https://canva.link/6r1iq6ko5do3d8u",
	},
	{
		date: "2026-06-01T00:00:00.000Z",
		link: "https://canva.link/fgj1kh1jfirf3we",
	},
	{
		date: "2026-07-01T00:00:00.000Z",
		link: "https://canva.link/au4a2vt3fvit03j",
	},
];

async function main() {
	console.log("Seeding magazines...");
	for (const mag of magazines) {
		await prisma.magazine.create({
			data: {
				link: mag.link,
				date: new Date(mag.date),
			},
		});
	}
	console.log("Seeding complete!");
}

main()
	.catch(console.error)
	.finally(() => prisma.$disconnect());
