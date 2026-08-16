import prisma from "../lib/prisma.js";
import { DEFAULT_WEBSITE_PAGES } from "../lib/websitePages.js";

const hasPageTables = async () => {
  try {
    await prisma.websitePage.findFirst({ take: 1 });
    return true;
  } catch {
    return false;
  }
};

export const ensureDefaultPages = async () => {
  if (!(await hasPageTables())) return [];

  for (const pageDef of DEFAULT_WEBSITE_PAGES) {
    const existing = await prisma.websitePage.findUnique({ where: { key: pageDef.key } });
    if (existing) continue;

    await prisma.websitePage.create({
      data: {
        key: pageDef.key,
        title: pageDef.title,
        path: pageDef.path,
        description: pageDef.description,
        isPublished: pageDef.isPublished !== false,
        sections: {
          create: pageDef.sections.map((s) => ({
            key: s.key,
            type: s.type,
            title: s.title || null,
            subtitle: s.subtitle || null,
            content: s.content || null,
            image: s.image || null,
            buttonText: s.buttonText || null,
            buttonLink: s.buttonLink || null,
            order: s.order || 0,
            isActive: s.isActive !== false,
          })),
        },
      },
    });
  }

  return prisma.websitePage.findMany({
    include: { sections: { orderBy: { order: "asc" } } },
    orderBy: { id: "asc" },
  });
};

/** Public: get one published page with active sections */
export const getPublicPage = async (req, res) => {
  const key = req.params.key;
  try {
    if (!(await hasPageTables())) {
      const fallback = DEFAULT_WEBSITE_PAGES.find((p) => p.key === key);
      if (!fallback) return res.status(404).json({ message: "Page not found" });
      return res.status(200).json({
        ...fallback,
        sections: fallback.sections.filter((s) => s.isActive !== false),
        _fallback: true,
      });
    }

    await ensureDefaultPages();
    const page = await prisma.websitePage.findUnique({
      where: { key },
      include: {
        sections: {
          where: { isActive: true },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!page || !page.isPublished) {
      return res.status(404).json({ message: "Page not found" });
    }

    res.status(200).json(page);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get page" });
  }
};

/** Admin: list all pages */
export const getAdminPages = async (req, res) => {
  try {
    if (!(await hasPageTables())) {
      return res.status(200).json(
        DEFAULT_WEBSITE_PAGES.map((p, i) => ({
          id: i + 1,
          ...p,
          sections: p.sections,
          _fallback: true,
        }))
      );
    }

    const pages = await ensureDefaultPages();
    res.status(200).json(pages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get pages" });
  }
};

/** Admin: get one page with all sections */
export const getAdminPage = async (req, res) => {
  const key = req.params.key;
  try {
    if (!(await hasPageTables())) {
      const fallback = DEFAULT_WEBSITE_PAGES.find((p) => p.key === key);
      if (!fallback) return res.status(404).json({ message: "Page not found" });
      return res.status(200).json({ id: 0, ...fallback, _fallback: true });
    }

    await ensureDefaultPages();
    const page = await prisma.websitePage.findUnique({
      where: { key },
      include: { sections: { orderBy: { order: "asc" } } },
    });
    if (!page) return res.status(404).json({ message: "Page not found" });
    res.status(200).json(page);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get page" });
  }
};

export const updateAdminPage = async (req, res) => {
  const key = req.params.key;
  try {
    if (!(await hasPageTables())) {
      return res.status(503).json({
        message: "Page tables not migrated yet. Run prisma migrate on the API.",
      });
    }

    const { title, description, path, isPublished } = req.body;
    const page = await prisma.websitePage.update({
      where: { key },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(path !== undefined && { path }),
        ...(isPublished !== undefined && { isPublished: !!isPublished }),
      },
      include: { sections: { orderBy: { order: "asc" } } },
    });
    res.status(200).json(page);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update page" });
  }
};

export const createPageSection = async (req, res) => {
  const key = req.params.key;
  try {
    if (!(await hasPageTables())) {
      return res.status(503).json({ message: "Page tables not migrated yet." });
    }

    const page = await prisma.websitePage.findUnique({ where: { key } });
    if (!page) return res.status(404).json({ message: "Page not found" });

    const maxOrder = await prisma.pageSection.aggregate({
      where: { pageId: page.id },
      _max: { order: true },
    });

    const section = await prisma.pageSection.create({
      data: {
        pageId: page.id,
        key: req.body.key || `section_${Date.now()}`,
        type: req.body.type || "CUSTOM",
        title: req.body.title || null,
        subtitle: req.body.subtitle || null,
        content: req.body.content || null,
        image: req.body.image || null,
        buttonText: req.body.buttonText || null,
        buttonLink: req.body.buttonLink || null,
        config: req.body.config || undefined,
        order: req.body.order ?? (maxOrder._max.order || 0) + 1,
        isActive: req.body.isActive !== false,
      },
    });
    res.status(201).json(section);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create section" });
  }
};

export const updatePageSection = async (req, res) => {
  const id = parseInt(req.params.sectionId, 10);
  try {
    if (!(await hasPageTables())) {
      return res.status(503).json({ message: "Page tables not migrated yet." });
    }

    const data = { ...req.body };
    delete data.id;
    delete data.pageId;
    delete data.createdAt;
    delete data.updatedAt;

    const section = await prisma.pageSection.update({ where: { id }, data });
    res.status(200).json(section);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update section" });
  }
};

export const deletePageSection = async (req, res) => {
  const id = parseInt(req.params.sectionId, 10);
  try {
    if (!(await hasPageTables())) {
      return res.status(503).json({ message: "Page tables not migrated yet." });
    }
    await prisma.pageSection.delete({ where: { id } });
    res.status(200).json({ message: "Section deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete section" });
  }
};

/** Reorder sections: body.sectionIds = [id, id, ...] in desired order */
export const reorderPageSections = async (req, res) => {
  const key = req.params.key;
  const { sectionIds } = req.body;
  try {
    if (!(await hasPageTables())) {
      return res.status(503).json({ message: "Page tables not migrated yet." });
    }
    if (!Array.isArray(sectionIds)) {
      return res.status(400).json({ message: "sectionIds array required" });
    }

    const page = await prisma.websitePage.findUnique({ where: { key } });
    if (!page) return res.status(404).json({ message: "Page not found" });

    await prisma.$transaction(
      sectionIds.map((id, index) =>
        prisma.pageSection.updateMany({
          where: { id: parseInt(id, 10), pageId: page.id },
          data: { order: index + 1 },
        })
      )
    );

    const sections = await prisma.pageSection.findMany({
      where: { pageId: page.id },
      orderBy: { order: "asc" },
    });
    res.status(200).json(sections);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to reorder sections" });
  }
};
