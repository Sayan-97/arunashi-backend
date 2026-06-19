import { prisma } from "./src/prisma/index.ts";

const magazines = [
	{
		link: "https://canva.link/4sqnyi6oghqa5re",
		date: new Date("2025-03-01"),
		image: "/public/uploads/magazines/magazine-img-1.png",
	},
	{
		link: "https://canva.link/ct65yaksocr3gxc",
		date: new Date("2025-04-01"),
		image: "/public/uploads/magazines/magazine-img-1.png",
	},
	{
		link: "https://canva.link/z7l45ncmir2pf0q",
		date: new Date("2025-05-01"),
		image: "/public/uploads/magazines/magazine-img-1.png",
	},
	{
		link: "https://canva.link/kqti1qwh1obls4d",
		date: new Date("2025-06-01"),
		image: "/public/uploads/magazines/magazine-img-1.png",
	},
	{
		link: "https://canva.link/fw8t26jhat4wc8j",
		date: new Date("2025-09-01"),
		image: "/public/uploads/magazines/magazine-img-1.png",
	},
	{
		link: "https://canva.link/028c00qwb27wjhn",
		date: new Date("2025-10-01"),
		image: "/public/uploads/magazines/magazine-img-1.png",
	},
	{
		link: "https://canva.link/h1zgla572dnfgp7",
		date: new Date("2025-11-01"),
		image: "/public/uploads/magazines/magazine-img-1.png",
	},
	{
		link: "https://canva.link/m8escywho6a6rb8",
		date: new Date("2025-12-01"),
		image: "/public/uploads/magazines/magazine-img-1.png",
	},
	{
		link: "https://canva.link/o5n26evuysnrew7",
		date: new Date("2026-01-01"),
		image: "/public/uploads/magazines/magazine-img-1.png",
	},
	{
		link: "https://canva.link/ltd600uorp0w65j",
		date: new Date("2026-02-01"),
		image: "/public/uploads/magazines/magazine-img-1.png",
	},
	{
		link: "https://canva.link/kz5s6r7nhbvwv6o",
		date: new Date("2026-03-01"),
		image: "/public/uploads/magazines/magazine-img-1.png",
	},
	{
		link: "https://canva.link/5zklv99zqm2wb9b",
		date: new Date("2026-04-01"),
		image: "/public/uploads/magazines/magazine-img-1.png",
	},
	{
		link: "https://canva.link/6r1iq6ko5do3d8u",
		date: new Date("2026-05-01"),
		image: "/public/uploads/magazines/magazine-img-1.png",
	},
	{
		link: "https://canva.link/fgj1kh1jfirf3we",
		date: new Date("2026-06-01"),
		image: "/public/uploads/magazines/magazine-img-1.png",
	},
	{
		link: "https://canva.link/au4a2vt3fvit03j",
		date: new Date("2026-07-01"),
		image: "/public/uploads/magazines/magazine-img-1.png",
	},
];

async function seed() {
	await prisma.magazine.deleteMany();
	console.log("Deleted all existing magazines.");
	for (const mag of magazines) {
		await prisma.magazine.create({ data: mag });
	}
	console.log("Seeded magazines with images successfully!");
	await prisma.$disconnect();
}

seed().catch((e) => {
	console.error(e);
	process.exit(1);
});
