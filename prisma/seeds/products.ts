import { PrismaClient, ProductCategory, ProductStatus, User, Product } from '@prisma/client'

export interface CreatedProducts {
    products: Product[]
}

export async function createProducts(prisma: PrismaClient, adminUser: User): Promise<CreatedProducts> {
    try {
        const productList = []

        // 1. Python 课程
        const product1 = await prisma.product.upsert({
            where: { productCode: 'COURSE_001' },
            update: {},
            create: {
                productCode: 'COURSE_001',
                name: 'Python 基础编程课程',
                description: '从零开始学习 Python 编程，适合初学者的完整课程体系。包含基础语法、数据结构、面向对象编程等核心内容。',
                shortDescription: 'Python 零基础入门课程',
                category: ProductCategory.COURSE,
                status: ProductStatus.ACTIVE,
                price: 29900,
                originalPrice: 39900,
                currency: 'CNY',
                tags: ['编程', 'Python', '初学者', '基础'],
                imageUrl: 'https://example.com/images/python-course.jpg',
                videoUrl: 'https://example.com/videos/python-intro.mp4',
                sortOrder: 1,
                isRecommended: true,
                isFeatured: true,
                salesCount: 156,
                viewCount: 2340,
                rating: 4.8,
                reviewCount: 89,
                createdBy: adminUser.id,
                updatedBy: adminUser.id,
                publishedAt: new Date('2024-01-15')
            }
        })
        productList.push(product1)

        // 2. JavaScript 课程
        const product2 = await prisma.product.upsert({
            where: { productCode: 'COURSE_002' },
            update: {},
            create: {
                productCode: 'COURSE_002',
                name: 'JavaScript 全栈开发',
                description: '掌握现代 JavaScript 开发技术，包含前端框架、后端开发、数据库操作等全栈技能。',
                shortDescription: 'JavaScript 全栈开发课程',
                category: ProductCategory.COURSE,
                status: ProductStatus.ACTIVE,
                price: 49900,
                originalPrice: 69900,
                currency: 'CNY',
                tags: ['JavaScript', '全栈', 'React', 'Node.js'],
                imageUrl: 'https://example.com/images/js-course.jpg',
                videoUrl: 'https://example.com/videos/js-intro.mp4',
                sortOrder: 2,
                isRecommended: true,
                isFeatured: false,
                salesCount: 234,
                viewCount: 3456,
                rating: 4.9,
                reviewCount: 167,
                createdBy: adminUser.id,
                updatedBy: adminUser.id,
                publishedAt: new Date('2024-01-20')
            }
        })
        productList.push(product2)

        // 3. 数据分析课程
        const product3 = await prisma.product.upsert({
            where: { productCode: 'COURSE_003' },
            update: {},
            create: {
                productCode: 'COURSE_003',
                name: '数据分析与可视化',
                description: '学习使用 Python 进行数据分析，掌握 Pandas、NumPy、Matplotlib 等工具，培养数据思维。',
                shortDescription: '数据分析入门课程',
                category: ProductCategory.COURSE,
                status: ProductStatus.ACTIVE,
                price: 39900,
                originalPrice: 59900,
                currency: 'CNY',
                tags: ['数据分析', 'Python', 'Pandas', '可视化'],
                imageUrl: 'https://example.com/images/data-course.jpg',
                videoUrl: 'https://example.com/videos/data-intro.mp4',
                sortOrder: 3,
                isRecommended: false,
                isFeatured: true,
                salesCount: 89,
                viewCount: 1567,
                rating: 4.7,
                reviewCount: 45,
                createdBy: adminUser.id,
                updatedBy: adminUser.id,
                publishedAt: new Date('2024-02-01')
            }
        })
        productList.push(product3)

        // 4. 会员服务
        const product4 = await prisma.product.upsert({
            where: { productCode: 'MEMBERSHIP_001' },
            update: {},
            create: {
                productCode: 'MEMBERSHIP_001',
                name: '年度会员服务',
                description: '享受全年无限制学习权限，包含所有课程内容、专属答疑服务、学习资料下载等特权。',
                shortDescription: '年度VIP会员',
                category: ProductCategory.MEMBERSHIP,
                status: ProductStatus.ACTIVE,
                price: 99900,
                originalPrice: 129900,
                currency: 'CNY',
                tags: ['会员', 'VIP', '全课程', '答疑'],
                imageUrl: 'https://example.com/images/membership.jpg',
                videoUrl: null,
                sortOrder: 4,
                isRecommended: true,
                isFeatured: true,
                salesCount: 567,
                viewCount: 8901,
                rating: 4.9,
                reviewCount: 234,
                createdBy: adminUser.id,
                updatedBy: adminUser.id,
                publishedAt: new Date('2024-01-10')
            }
        })
        productList.push(product4)

        // 5. 咨询服务
        const product5 = await prisma.product.upsert({
            where: { productCode: 'CONSULTING_001' },
            update: {},
            create: {
                productCode: 'CONSULTING_001',
                name: '一对一技术咨询',
                description: '专业导师一对一指导，针对个人学习情况制定专属学习计划，解决学习过程中的疑难问题。',
                shortDescription: '一对一技术指导',
                category: ProductCategory.CONSULTATION,
                status: ProductStatus.ACTIVE,
                price: 19900,
                originalPrice: 29900,
                currency: 'CNY',
                tags: ['咨询', '一对一', '导师', '指导'],
                imageUrl: 'https://example.com/images/consulting.jpg',
                videoUrl: null,
                sortOrder: 5,
                isRecommended: false,
                isFeatured: false,
                salesCount: 123,
                viewCount: 789,
                rating: 4.8,
                reviewCount: 67,
                createdBy: adminUser.id,
                updatedBy: adminUser.id,
                publishedAt: new Date('2024-02-15')
            }
        })
        productList.push(product5)

        // 6. 实战项目
        const product6 = await prisma.product.upsert({
            where: { productCode: 'PROJECT_001' },
            update: {},
            create: {
                productCode: 'PROJECT_001',
                name: '企业级项目实战',
                description: '通过真实企业项目案例，学习完整的开发流程，提升实际开发能力和项目经验。',
                shortDescription: '企业项目实战训练',
                category: ProductCategory.OTHER,
                status: ProductStatus.ACTIVE,
                price: 79900,
                originalPrice: 99900,
                currency: 'CNY',
                tags: ['实战', '项目', '企业级', '开发'],
                imageUrl: 'https://example.com/images/project.jpg',
                videoUrl: 'https://example.com/videos/project-intro.mp4',
                sortOrder: 6,
                isRecommended: true,
                isFeatured: false,
                salesCount: 78,
                viewCount: 1234,
                rating: 4.6,
                reviewCount: 34,
                createdBy: adminUser.id,
                updatedBy: adminUser.id,
                publishedAt: new Date('2024-03-01')
            }
        })
        productList.push(product6)

        return {
            products: productList
        }
    } catch (error) {
        console.error('❌ 产品创建失败:', error)
        throw error
    }
}