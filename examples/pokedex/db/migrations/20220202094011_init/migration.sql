-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "characterName" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_characterName_key" ON "User"("characterName");
